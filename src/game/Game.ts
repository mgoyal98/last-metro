import {
  ACESFilmicToneMapping,
  PerspectiveCamera,
  Raycaster,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from "three";
import { StationAudio } from "../audio/Audio";
import { Station } from "../world/Station";
import type { Target, TargetId } from "../world/Station";
import { UI } from "../ui/UI";
import type { Screen } from "../ui/UI";
import { readSettings, storeSettings } from "../ui/settings";
import { Player } from "./player";
import { initializePhysics } from "./physics";
import { freshProgress, loadProgress, saveProgress, transition } from "./state";
import type { Action, Progress } from "./state";

export class Game {
  private readonly renderer: WebGLRenderer;
  private readonly camera = new PerspectiveCamera(
    68,
    innerWidth / innerHeight,
    0.08,
    90,
  );
  private readonly audio = new StationAudio();
  private readonly ui: UI;
  private readonly station: Station;
  private readonly player: Player;
  private readonly flashlight = new SpotLight(
    "#e6e7c9",
    28,
    20,
    0.43,
    0.7,
    1.35,
  );
  private readonly ray = new Raycaster();
  private readonly view = new Vector3();
  private readonly direction = new Vector3();
  private state: Progress = freshProgress();
  private settings = readSettings();
  private active = false;
  private started = false;
  private hasLock = false;
  private dragging = false;
  private currentTarget: Target | null = null;
  private settingsReturn: Screen = "title";
  private lastTime = 0;
  private accumulator = 0;
  private elapsed = 0;
  private subtitleRemaining = 0;
  private announcement = "";
  private captionRemaining = 0;
  private persistentStorage = true;
  private nextStep = 0;
  private introPlayed = false;
  private nextHint = 75;
  private destroyed = false;
  private averageFrame = 0;
  private saved = loadProgress();

  private constructor(canvas: HTMLCanvasElement, station: Station) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.station = station;
    this.player = new Player(this.camera, station.physics);
    this.ui = new UI(document.getElementById("app")!);
    station.scene.add(this.camera);
    this.flashlight.position.set(0.15, -0.1, 0);
    this.flashlight.target.position.set(0, -0.12, -4);
    this.camera.add(this.flashlight, this.flashlight.target);
    this.applySettings();
    this.resize();
    this.bindInput(canvas);
    this.show("title");
    this.ui.onAction = (action) => this.action(action);
    this.ui.onSettings = (key, value) => {
      this.settings = { ...this.settings, [key]: value };
      storeSettings(this.settings);
      this.applySettings();
    };
    this.renderer.setAnimationLoop((time) => this.frame(time));
    if (import.meta.env.DEV && new URLSearchParams(location.search).has("test"))
      this.installTestBridge();
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.pause();
      this.ui.toast(
        "Graphics context lost. Reload this page to recover your checkpoint.",
      );
    });
    canvas.addEventListener("webglcontextrestored", () => location.reload());
  }

  static async create(canvas: HTMLCanvasElement): Promise<Game> {
    const physics = await initializePhysics();
    return new Game(canvas, new Station(physics));
  }

  private applySettings(): void {
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, this.settings.quality === "low" ? 1 : 1.7),
    );
    this.renderer.toneMappingExposure = this.settings.brightness * 1.15;
    this.audio.setVolume(this.settings.volume);
    if (!this.settings.captions) this.ui.caption("");
  }
  private resize(): void {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
  private bindInput(canvas: HTMLCanvasElement): void {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("blur", () => {
      this.player.keys.clear();
      this.pause();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause();
    });
    document.addEventListener("pointerlockchange", () => {
      const captured = document.pointerLockElement === canvas;
      if (this.hasLock && !captured && this.active) this.pause();
      this.hasLock = captured;
    });
    document.addEventListener("pointerlockerror", () =>
      this.ui.toast(
        "Mouse capture unavailable. Hold the mouse button and drag to look.",
      ),
    );
    document.addEventListener("mousemove", (event) => {
      if (this.active && (this.hasLock || this.dragging))
        this.player.look(
          event.movementX,
          event.movementY,
          this.settings.sensitivity,
        );
    });
    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0 && this.active) this.dragging = true;
    });
    window.addEventListener("mouseup", () => {
      this.dragging = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        event.preventDefault();
        if (this.active) this.pause();
        else if (this.ui.screen === "settings") this.action("settings-back");
        else if (this.ui.screen !== "title" && this.ui.screen !== "ending")
          this.resume();
        return;
      }
      if (!this.active) return;
      if (["Tab", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code))
        event.preventDefault();
      this.player.keys.add(event.code);
      if (event.repeat) return;
      if (event.code === "Tab") this.show("inventory");
      if (event.code === "KeyE") this.interact();
      if (event.code === "KeyF") {
        this.player.flashlight = !this.player.flashlight;
        this.audio.cue("collect");
      }
      if (event.code === "KeyC") this.player.crouched = !this.player.crouched;
    });
    document.addEventListener("keyup", (event) =>
      this.player.keys.delete(event.code),
    );
  }

  private action(action: string): void {
    if (action.startsWith("note:")) {
      this.show("note", action.slice(5));
      return;
    }
    switch (action) {
      case "start":
        this.begin(freshProgress());
        break;
      case "continue":
        this.begin(this.saved ?? loadProgress() ?? freshProgress());
        break;
      case "resume":
        this.resume();
        break;
      case "pause":
        this.pause();
        break;
      case "inventory":
        this.show("inventory");
        break;
      case "checkpoint":
        this.begin(this.saved ?? loadProgress() ?? freshProgress());
        this.ui.toast("Checkpoint restored.");
        break;
      case "settings":
        this.settingsReturn = this.ui.screen === "title" ? "title" : "pause";
        this.show("settings");
        break;
      case "settings-back":
        this.show(this.settingsReturn);
        break;
      case "title":
        this.started = false;
        this.saved = this.saved ?? loadProgress();
        this.show("title");
        break;
      case "power": {
        if (this.state.fuses.length < 2) {
          this.ui.feedback(
            "Both fuses are needed. Check the platform bench and the ticket hall workbench.",
          );
          return;
        }
        const routes = this.ui.routes();
        const result = transition(this.state, { type: "power", ...routes });
        if (!result.powered) {
          this.audio.cue("door");
          this.ui.feedback(
            "Circuit overload. Nothing was consumed. Check the engineer’s diagram in your journal.",
          );
          return;
        }
        this.commit({ type: "power", ...routes });
        this.resume();
        this.audio.cue("power");
        this.caption("[ Machinery starts in the service corridor ]");
        this.say(
          "PA SYSTEM: “Service access restored. Please proceed to Control. Do not wait for anyone.”",
          9,
        );
        break;
      }
    }
  }
  private begin(state: Progress): void {
    this.state = state.completed ? freshProgress() : state;
    this.station.apply(this.state);
    this.player.reset(
      this.state.powered ? 12 : 1.5,
      this.state.powered ? -9 : 15,
    );
    this.elapsed = 0;
    this.subtitleRemaining = 0;
    this.captionRemaining = 0;
    this.introPlayed = this.state.powered;
    this.nextHint = 75;
    this.nextStep = this.player.steps;
    this.started = true;
    this.persist();
    this.resume();
    this.ui.toast(
      this.persistentStorage
        ? "WASD to move · Mouse to look · E to inspect · Tab for journal"
        : "Browser storage unavailable. Checkpoints last for this session only.",
    );
    this.caption("[ Fluorescent hum. A train idles in the dark. ]");
  }
  private show(screen: Screen, note?: string): void {
    this.active = screen === "playing";
    if (!this.active) {
      this.player.keys.clear();
      this.dragging = false;
      if (document.pointerLockElement) document.exitPointerLock();
      this.audio.pause();
    }
    this.ui.show(
      screen,
      this.state,
      this.settings,
      !!this.saved && !this.saved.completed,
      note,
    );
  }
  private resume(): void {
    if (!this.started) {
      this.show("title");
      return;
    }
    this.show("playing");
    if (this.subtitleRemaining > 0) this.ui.announce(this.announcement);
    this.accumulator = 0;
    void this.audio.start();
    try {
      const request = this.renderer.domElement.requestPointerLock?.();
      request?.catch(() =>
        this.ui.toast("Hold the mouse button and drag to look."),
      );
    } catch {
      this.ui.toast("Hold the mouse button and drag to look.");
    }
  }
  private pause(): void {
    if (this.active) this.show("pause");
  }
  private persist(): void {
    this.persistentStorage = saveProgress(this.state);
    if (!this.persistentStorage)
      this.ui.toast(
        "Browser storage unavailable. Progress is kept for this session only.",
      );
    this.saved = {
      ...this.state,
      fuses: [...this.state.fuses],
      notes: [...this.state.notes],
    };
  }
  private commit(action: Action): void {
    this.state = transition(this.state, action);
    this.station.apply(this.state);
    this.persist();
    this.nextHint = this.elapsed + 75;
  }
  private interact(): void {
    const target = this.findTarget();
    if (!target) return;
    if (target.id === "amber" || target.id === "blue") {
      this.commit({ type: "collect", fuse: target.id });
      this.audio.cue("collect");
      this.ui.toast(
        `Fuse ${target.id === "amber" ? "A · amber" : "B · blue"} recovered. ${this.persistentStorage ? "Checkpoint saved." : "Session checkpoint only."}`,
      );
    } else if (target.id === "diagram" || target.id === "map") {
      this.commit({ type: "note", id: target.id });
      this.show("note", target.id);
    } else if (target.id === "cabinet") this.show("cabinet");
    else if (target.id === "dispatch") {
      if (!this.state.powered) {
        this.ui.toast("Departure controls have no power.");
        return;
      }
      if (this.state.dispatched) {
        this.ui.toast("Train ready. Return to Platform 09.");
        return;
      }
      this.commit({ type: "dispatch" });
      this.audio.cue("power");
      this.caption("[ The departure relay engages ]");
      this.say(
        "PA SYSTEM: “Service 09 for Daybreak is ready. Board on the platform. Mind the gap.”",
        9,
      );
      this.ui.toast(
        this.persistentStorage
          ? "Departure authorised. Checkpoint saved."
          : "Departure authorised. Session checkpoint only.",
      );
    } else if (target.id === "train") {
      if (!this.state.dispatched) {
        this.ui.toast(
          "The train doors are locked. Restore power, then authorise departure in Control.",
        );
        return;
      }
      this.commit({ type: "board" });
      this.show("ending");
    }
  }
  private findTarget(): Target | null {
    this.camera.getWorldDirection(this.view);
    let best: Target | null = null;
    let distance = 2.85;
    for (const target of this.station.targets) {
      if (!target.mesh.visible) continue;
      this.direction.subVectors(target.position, this.camera.position);
      const length = this.direction.length();
      if (length > distance || length < 0.01) continue;
      this.direction.normalize();
      if (this.direction.dot(this.view) < 0.95) continue;
      this.ray.set(this.camera.position, this.direction);
      this.ray.far = length - 0.05;
      const blocked =
        this.ray.intersectObjects(
          this.station.solids.filter((mesh) => mesh.visible),
          false,
        ).length > 0;
      if (!blocked) {
        best = target;
        distance = length;
      }
    }
    return best;
  }
  private say(text: string, duration = 7): void {
    this.announcement = text;
    this.ui.announce(text);
    this.subtitleRemaining = duration;
  }
  private caption(text: string): void {
    if (!this.settings.captions) return;
    this.ui.caption(text);
    this.captionRemaining = 4;
  }
  private frame(time: number): void {
    if (this.destroyed) return;
    const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.1);
    this.lastTime = time;
    this.averageFrame += (dt * 1000 - this.averageFrame) * 0.03;
    if (this.active) {
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) {
        this.player.update(1 / 60, this.settings);
        this.accumulator -= 1 / 60;
        this.elapsed += 1 / 60;
        if (this.subtitleRemaining > 0) {
          this.subtitleRemaining -= 1 / 60;
          if (this.subtitleRemaining <= 0) this.ui.clearAnnouncement();
        }
        if (this.captionRemaining > 0) {
          this.captionRemaining -= 1 / 60;
          if (this.captionRemaining <= 0) this.ui.caption("");
        }
      }
      this.flashlight.visible = this.player.flashlight;
      this.flashlight.intensity =
        !this.settings.reducedFlicker &&
        this.state.powered &&
        Math.sin(this.elapsed * 17) > 0.99
          ? 21
          : 28;
      if (this.player.steps > this.nextStep + 1.6) {
        this.audio.cue("step");
        this.nextStep = this.player.steps;
      }
      if (!this.introPlayed && this.elapsed > 2) {
        this.introPlayed = true;
        this.say(
          "PA SYSTEM: “For your safety, please ignore any familiar voices.”",
          8,
        );
      }
      if (this.elapsed > this.nextHint) {
        this.nextHint = this.elapsed + 90;
        this.ui.toast(
          this.state.dispatched
            ? "The boarding point is near where you woke up on Platform 09."
            : this.state.powered
              ? "The service corridor leads north from the ticket hall to Control."
              : this.state.fuses.length < 2
                ? "Look for glowing fuses on the platform bench and the ticket hall workbench."
                : "Check your journal: the engineer left the circuit routing instructions.",
        );
      }
      this.currentTarget = this.findTarget();
      this.ui.interaction(this.currentTarget?.label ?? null);
      this.ui.update(
        this.state,
        this.station.location(this.camera.position),
        this.player.crouched,
        this.player.flashlight,
      );
    } else if (!this.started) {
      this.camera.position.set(2.2, 2.1, 16.7);
      this.camera.lookAt(-1.5, 1.9, -5);
      this.flashlight.visible = false;
    }
    this.renderer.render(this.station.scene, this.camera);
  }

  private installTestBridge(): void {
    // The guard also removes this method's body from the production bundle.
    if (!import.meta.env.DEV) return;
    const bridge = {
      snapshot: () => ({
        progress: structuredClone(this.state),
        active: this.active,
        elapsed: this.elapsed,
        screen: this.ui.screen,
        position: { ...this.player.physics.position },
        crouched: this.player.crouched,
        flashlight: this.player.flashlight,
        target: this.currentTarget?.id,
        frameMs: this.averageFrame,
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
      }),
      goTo: (id: TargetId) => {
        const target = this.station.targets.find((item) => item.id === id)!;
        this.player.reset(...target.approach);
        const direction = target.position
          .clone()
          .sub(this.camera.position)
          .normalize();
        this.player.yaw = Math.atan2(-direction.x, -direction.z);
        this.player.pitch = Math.asin(direction.y);
        this.player.update(1 / 60, this.settings);
        this.camera.updateMatrixWorld();
      },
      face: (x: number, z: number, y = 1.72) => {
        const direction = new Vector3(x, y, z)
          .sub(this.camera.position)
          .normalize();
        this.player.yaw = Math.atan2(-direction.x, -direction.z);
        this.player.pitch = Math.asin(direction.y);
      },
      targetPosition: (id: TargetId) => {
        const target = this.station.targets.find((item) => item.id === id)!;
        return {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        };
      },
      place: (x: number, z: number, yaw = 0) => {
        this.player.reset(x, z);
        this.player.yaw = yaw;
      },
      dispose: () => {
        this.destroyed = true;
        this.renderer.setAnimationLoop(null);
        this.renderer.dispose();
      },
    };
    Object.assign(window, { __LAST_METRO__: bridge });
  }
}
