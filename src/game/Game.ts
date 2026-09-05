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
import {
  advanceTime,
  checkpointSpawn,
  freshProgress,
  hint,
  loadProgress,
  recoverProgress,
  saveProgress,
  transition,
} from "./state";
import { isNoteId } from "./puzzles";
import type { Action, Progress } from "./state";
import { Enemy } from "./Enemy";
import { distance, Navigation } from "./navigation";
import type { Point } from "./navigation";
import { VOICES } from "../audio/voices";
import { loadStationAssets } from "../world/assets";

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
  private readonly enemy: Enemy;
  private hidden = false;
  private hideLight = true;
  private tokens = 3;
  private flight: { start: Point; end: Point; age: number } | null = null;
  private noiseClock = 0;
  private enemyStep = 0;
  private machineUntil = 0;
  private machineReady = 0;
  private machinePulse = 0;
  private posterChanged = false;
  private lastMoved = 0;
  private echoPlayed = false;
  private lastScare = 0;
  private lightEvent = false;
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
  private helpReturn: Screen = "title";
  private lastTime = 0;
  private accumulator = 0;
  private elapsed = 0;
  private subtitleRemaining = 0;
  private announcement = "";
  private captionRemaining = 0;
  private captionPriority = 0;
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
    this.enemy = new Enemy(new Navigation(station.physics));
    this.ui = new UI(document.getElementById("app")!);
    station.scene.add(this.camera);
    this.flashlight.position.set(0.15, -0.1, 0);
    this.flashlight.target.position.set(0, -0.12, -4);
    this.camera.add(this.flashlight, this.flashlight.target);
    this.applySettings();
    this.resize();
    this.bindInput(canvas);
    this.station.apply(this.state);
    this.show("loading");
    this.ui.onAction = (action) => this.action(action);
    this.ui.onSettings = (key, value) => {
      this.settings = { ...this.settings, [key]: value };
      storeSettings(this.settings);
      this.applySettings();
    };
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

  static async create(
    canvas: HTMLCanvasElement,
    stage: (text: string) => void = () => {},
  ): Promise<Game> {
    stage("Loading station surfaces, props and collision…");
    const [physics, assets] = await Promise.all([
      initializePhysics(),
      loadStationAssets(),
    ]);
    stage("Lighting the station…");
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const game = new Game(canvas, new Station(physics, assets));
    game.station.scene.updateMatrixWorld(true);
    // Prepare both light configurations before accepting player input.
    await game.renderer.compileAsync(game.station.scene, game.camera);
    game.flashlight.visible = false;
    await game.renderer.compileAsync(game.station.scene, game.camera);
    game.show("title");
    game.renderer.setAnimationLoop((time) => game.frame(time));
    return game;
  }

  private applySettings(): void {
    this.renderer.setPixelRatio(
      this.settings.quality === "low"
        ? Math.min(devicePixelRatio, 1) * 0.75
        : Math.min(devicePixelRatio, 1.7),
    );
    this.renderer.toneMappingExposure = this.settings.brightness * 1.15;
    this.audio.setVolume(this.settings.volume);
    this.audio.setMix(this.settings.effectsVolume, this.settings.voiceVolume);
    this.ui.applySettings(this.settings);
    this.station.setQuality(this.settings.quality);
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
    window.addEventListener("pagehide", () => {
      if (this.started) this.persist();
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
      if (this.ui.screen === "loading") return;
      if (event.code === "Escape") {
        event.preventDefault();
        if (this.active) this.pause();
        else if (this.ui.screen === "settings") this.action("settings-back");
        else if (this.ui.screen === "help") this.action("help-back");
        else if (
          this.ui.screen !== "title" &&
          this.ui.screen !== "ending" &&
          this.ui.screen !== "captured" &&
          this.ui.screen !== "expired"
        )
          this.resume();
        return;
      }
      if (!this.active) return;
      if (["Tab", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code))
        event.preventDefault();
      this.player.keys.add(event.code);
      if (event.repeat) return;
      if (event.code === "Tab") this.show("inventory");
      if (event.code === "KeyH") this.show("hints");
      if (event.code === "KeyE") this.interact();
      if (event.code === "KeyQ") this.throwToken();
      if (event.code === "KeyF" && !this.hidden) {
        this.player.flashlight = !this.player.flashlight;
        this.audio.cue("collect");
      }
      if (event.code === "KeyC" && !this.hidden)
        this.player.crouched = !this.player.crouched;
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
    if (action === "board:09" || action === "board:99") {
      this.commit({
        type: "board",
        service: action === "board:09" ? "09" : "99",
      });
      if (this.state.completed) this.show("ending");
      return;
    }
    switch (action) {
      case "help":
        this.helpReturn = this.started ? "pause" : "title";
        this.show("help");
        break;
      case "help-back":
        this.show(this.helpReturn);
        break;
      case "hints":
        this.show("hints");
        break;
      case "hint-next":
        this.ui.nextHint();
        this.show("hints");
        break;
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
      case "recover":
        this.begin(recoverProgress(this.saved ?? this.state));
        this.ui.toast("Checkpoint restored. A fresh 18-minute window is open.");
        break;
      case "access": {
        const result = transition(this.state, {
          type: "access",
          code: this.ui.accessCode(),
        });
        if (!result.controlUnlocked) {
          this.ui.feedback(
            "Access denied. Check the shift record, locker assignment and stored access format. Try again.",
          );
          return;
        }
        const wasUnlocked = this.state.controlUnlocked;
        this.commit({ type: "access", code: this.ui.accessCode() });
        if (!wasUnlocked) this.commit({ type: "note", id: "falsePA" });
        this.resume();
        this.audio.cue("door");
        this.ui.toast(
          this.persistentStorage
            ? "Control unlocked. Checkpoint saved. The live PA transcript is in your journal."
            : "Control unlocked. Session checkpoint only. The PA transcript is in your journal.",
        );
        if (!wasUnlocked) this.voice("falsePA");
        break;
      }
      case "dispatch": {
        const sequence = this.ui.sequence();
        const result = transition(this.state, { type: "dispatch", sequence });
        if (!result.dispatched) {
          this.ui.feedback(
            "Interlock rejected the sequence. Nothing was consumed. Read the 23:58 archive for the order.",
          );
          return;
        }
        this.commit({ type: "dispatch", sequence });
        this.resume();
        this.audio.cue("power");
        this.caption("[ The PA cuts out. Two boarding relays engage. ]");
        this.voice("dispatch");
        break;
      }
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
        this.enemy.activate();
        this.voice("power");
        this.ui.toast(
          "Something heard the power. Break sight, then E inside a shelter. Q throws a token; sprinting is loud.",
        );
        break;
      }
    }
  }
  private begin(state: Progress): void {
    this.ui.resetHints();
    this.state = state.completed
      ? freshProgress()
      : state.remainingSeconds <= 0
        ? recoverProgress(state)
        : state;
    this.station.apply(this.state);
    this.player.reset(...checkpointSpawn(this.state));
    this.enemy.reset(this.state.powered);
    this.hidden = false;
    this.player.flashlight = true;
    this.tokens = 3;
    this.flight = null;
    this.noiseClock = 0;
    this.enemyStep = 0;
    this.machineUntil = 0;
    this.machineReady = 0;
    this.machinePulse = 0;
    this.posterChanged = false;
    this.lastMoved = 0;
    this.echoPlayed = false;
    this.lastScare = 0;
    this.lightEvent = false;
    this.station.changePoster(false);
    this.station.showToken(0, 0, 0, false);
    this.station.animateThreat(this.enemy);
    this.audio.stopVoice();
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
        ? this.state.powered
          ? "Checkpoint safe for 12 seconds. Break sight before hiding. Q throws a token · 3 per attempt."
          : "WASD to move · Mouse to look · E to inspect · Tab for journal"
        : "Browser storage unavailable. Checkpoints last for this session only.",
    );
    this.caption("[ Fluorescent hum. A train idles in the dark. ]");
  }
  private show(screen: Screen, note?: string): void {
    if (this.active && this.started && screen !== "playing") this.persist();
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
    if (this.state.remainingSeconds <= 0) {
      this.show("expired");
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
    if (this.hidden) {
      this.hidden = false;
      this.enemy.leaveHide();
      this.player.crouched = false;
      this.player.flashlight = this.hideLight;
      this.ui.toast("Left shelter. Move quietly.");
      return;
    }
    const target = this.findTarget();
    if (!target) return;
    if (target.id.startsWith("hide")) {
      if (
        distance(this.camera.position, {
          x: target.approach[0],
          z: target.approach[1],
        }) > 0.9
      ) {
        this.ui.toast("Step all the way inside the marked shelter to hide.");
        return;
      }
      this.enemy.enterHide(this.observer());
      this.hidden = true;
      this.hideLight = this.player.flashlight;
      this.player.flashlight = false;
      this.player.crouched = true;
      this.player.keys.clear();
      this.ui.toast(
        this.enemy.compromised
          ? "It saw you enter. This shelter is exposed — E to leave, sprint and break sight."
          : "Concealed. Time continues. E to leave shelter.",
      );
    } else if (target.id === "machine") {
      if (!this.state.powered) {
        this.ui.toast("The purge needs emergency power.");
        return;
      }
      if (this.elapsed < this.machineReady) {
        this.ui.toast(
          `Purge cooling down · ${Math.ceil(this.machineReady - this.elapsed)} seconds.`,
        );
        return;
      }
      this.machineUntil = this.elapsed + 8;
      this.machineReady = this.elapsed + 24;
      this.machinePulse = 0;
      this.caption(
        "[ Ventilation purge starts near the service entrance. It draws attention. ]",
      );
    } else if (target.id === "amber" || target.id === "blue") {
      this.commit({ type: "collect", fuse: target.id });
      this.audio.cue("collect");
      this.ui.toast(
        `Fuse ${target.id === "amber" ? "A · amber" : "B · blue"} recovered. ${this.persistentStorage ? "Checkpoint saved." : "Session checkpoint only."}`,
      );
    } else if (isNoteId(target.id)) {
      this.commit({ type: "note", id: target.id });
      this.show("note", target.id);
    } else if (target.id === "cabinet") this.show("cabinet");
    else if (target.id === "access") this.show("access");
    else if (target.id === "dispatch") {
      if (!this.state.controlUnlocked) {
        this.ui.toast("Control access is locked.");
        return;
      }
      this.show("dispatch");
    } else if (target.id === "train" || target.id === "falseTrain") {
      if (!this.state.dispatched) {
        this.ui.toast(
          "The train doors are locked. Restore power, then authorise departure in Control.",
        );
        return;
      }
      this.show("boarding", target.id === "train" ? "09" : "99");
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
  private voice(id: keyof typeof VOICES): void {
    const clip = VOICES[id];
    this.say(`${clip.speaker}: “${clip.text}”`, clip.seconds + 1);
    this.audio.voice(id);
  }
  private observer() {
    return {
      x: this.camera.position.x,
      z: this.camera.position.z,
      crouched: this.player.crouched,
      hidden: this.hidden,
    };
  }
  private throwToken(): void {
    if (this.hidden || this.flight) return;
    if (this.tokens <= 0) {
      this.ui.toast(
        "No tokens left. The ventilation purge can still distract it.",
      );
      return;
    }
    const start = { x: this.camera.position.x, z: this.camera.position.z };
    this.camera.getWorldDirection(this.view);
    const horizontal = Math.hypot(this.view.x, this.view.z);
    if (horizontal < 0.1) return;
    let end = { ...start };
    for (let d = 0.2; d <= 8; d += 0.2) {
      const next = {
        x: start.x + (this.view.x / horizontal) * d,
        z: start.z + (this.view.z / horizontal) * d,
      };
      if (
        !this.enemy.navigation.walkable(next, 0.34) ||
        !this.enemy.navigation.sight(start, next, 0.7, 0.7)
      )
        break;
      end = next;
    }
    if (distance(start, end) < 0.5) {
      this.ui.toast("Aim toward open floor to throw a token.");
      return;
    }
    this.tokens--;
    this.flight = { start, end, age: 0 };
  }
  private updateThreat(dt: number, moving: boolean): void {
    const previous = { ...this.enemy.position },
      oldState = this.enemy.state;
    this.enemy.update(dt, this.observer());
    this.audio.listen(this.camera.position, this.player.yaw);
    this.noiseClock -= dt;
    if (moving) {
      this.lastMoved = this.elapsed;
      if (this.noiseClock <= 0) {
        this.noiseClock = 0.45;
        const running =
          this.player.keys.has("ShiftLeft") ||
          this.player.keys.has("ShiftRight");
        this.enemy.hear({
          ...this.observer(),
          radius: this.player.crouched ? 1.5 : running ? 17 : 4,
        });
      }
    }
    if (this.flight) {
      this.flight.age += dt;
      const t = Math.min(1, this.flight.age / 0.65),
        { start, end } = this.flight;
      this.station.showToken(
        start.x + (end.x - start.x) * t,
        0.1 + Math.sin(t * Math.PI) * 0.4,
        start.z + (end.z - start.z) * t,
        true,
      );
      if (t === 1) {
        this.enemy.hear({ ...end, radius: 27 });
        this.spatial("token", end);
        this.caption("[ Metal token rings across the floor. ]");
        this.flight = null;
        this.station.showToken(0, 0, 0, false);
      }
    }
    if (this.elapsed < this.machineUntil && this.elapsed >= this.machinePulse) {
      this.machinePulse = this.elapsed + 1;
      const source = { x: 12.5, z: -8.5 };
      this.enemy.hear({ ...source, radius: 38 });
      this.spatial("machine", source);
    }
    this.enemyStep += distance(previous, this.enemy.position);
    if (this.enemyStep > 1.3) {
      this.enemyStep = 0;
      this.spatial("enemy", this.enemy.position);
      if (distance(this.enemy.position, this.camera.position) < 10) {
        const angle =
          Math.atan2(
            this.enemy.position.x - this.camera.position.x,
            -(this.enemy.position.z - this.camera.position.z),
          ) + this.player.yaw;
        const side =
          Math.sin(angle) > 0.35
            ? "right"
            : Math.sin(angle) < -0.35
              ? "left"
              : Math.cos(angle) < 0
                ? "behind"
                : "ahead";
        this.caption(
          `[ Heavy footsteps ${side}${this.enemy.navigation.sight(this.enemy.position, this.camera.position) ? "" : ", beyond the wall"}. ]`,
          0,
        );
      }
    }
    if (oldState !== "Chase" && this.enemy.state === "Chase") {
      this.caption(
        "[ A sharp breath. Fast footsteps — you have been seen. ]",
        2,
      );
      this.ui.toast(
        "SEEN · Sprint to break sight, then hide. A token will not distract it while it can see you.",
      );
      this.spatial("warning", this.enemy.position);
    }
    this.station.animateThreat(this.enemy);
    if (this.enemy.captured) {
      this.show("captured");
      return;
    }
    // Sparse one-shot events; only active simulation advances their spacing.
    if (
      !this.echoPlayed &&
      this.elapsed > 15 &&
      this.elapsed - this.lastMoved > 0.8 &&
      this.elapsed - this.lastMoved < 1.2 &&
      this.elapsed - this.lastScare > 12
    ) {
      this.echoPlayed = true;
      this.lastScare = this.elapsed;
      this.spatial("enemy", {
        x: this.camera.position.x + Math.sin(this.player.yaw) * 3,
        z: this.camera.position.z + Math.cos(this.player.yaw) * 3,
      });
      this.caption(
        "[ Your footsteps stop. One more step answers behind you. ]",
      );
    }
    if (
      !this.posterChanged &&
      this.state.dispatched &&
      this.station.location(this.camera.position) === "TICKET HALL" &&
      this.elapsed - this.lastScare > 12
    ) {
      this.posterChanged = true;
      this.lastScare = this.elapsed;
      this.station.changePoster(true);
      this.caption("[ The poster has changed. YOU WERE EXPECTED. ]");
    }
    if (
      !this.lightEvent &&
      this.state.controlUnlocked &&
      this.elapsed - this.lastScare > 16
    ) {
      this.lightEvent = true;
      this.lastScare = this.elapsed;
      this.spatial("warning", { x: 12, z: -18 });
      this.caption("[ A fluorescent ballast fails near Control. ]");
    }
    this.ui.threat(
      this.hidden
        ? this.enemy.compromised
          ? "SHELTER EXPOSED · E TO LEAVE"
          : "CONCEALED · E TO LEAVE"
        : this.enemy.grace > 0
          ? `SAFE WINDOW · ${Math.ceil(this.enemy.grace)}s`
          : this.enemy.state === "Chase"
            ? "SEEN · BREAK SIGHT"
            : this.enemy.awareness > 0.15
              ? "SOMETHING IS WATCHING"
              : "MOVE QUIETLY",
      this.tokens,
      this.enemy.state === "Chase" || this.enemy.compromised,
    );
  }
  private spatial(
    kind: "enemy" | "token" | "machine" | "warning",
    source: Point,
  ): void {
    this.audio.spatial(
      kind,
      source,
      !this.enemy.navigation.sight(
        source,
        this.camera.position,
        1.2,
        this.camera.position.y,
      ),
    );
  }
  private caption(text: string, priority = 1): void {
    if (!this.settings.captions) return;
    if (this.captionRemaining > 0 && priority < this.captionPriority) return;
    this.ui.caption(text);
    this.captionRemaining = 4;
    this.captionPriority = priority;
  }
  private frame(time: number): void {
    if (this.destroyed) return;
    const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.1);
    this.lastTime = time;
    this.averageFrame += (dt * 1000 - this.averageFrame) * 0.03;
    if (this.active) {
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) {
        if (this.hidden) this.player.keys.clear();
        const moving = this.player.update(1 / 60, this.settings);
        this.accumulator -= 1 / 60;
        this.elapsed += 1 / 60;
        this.state = advanceTime(this.state, 1 / 60);
        this.updateThreat(1 / 60, moving);
        if (!this.active) break;
        if (this.subtitleRemaining > 0) {
          this.subtitleRemaining -= 1 / 60;
          if (this.subtitleRemaining <= 0) this.ui.clearAnnouncement();
        }
        if (this.captionRemaining > 0) {
          this.captionRemaining -= 1 / 60;
          if (this.captionRemaining <= 0) this.ui.caption("");
        }
        if (this.state.remainingSeconds <= 0) break;
      }
      if (!this.active) {
        this.renderer.render(this.station.scene, this.camera);
        return;
      }
      if (this.state.remainingSeconds <= 0) {
        this.show("expired");
        this.renderer.render(this.station.scene, this.camera);
        return;
      }
      this.flashlight.visible = this.player.flashlight;
      this.flashlight.intensity =
        !this.settings.reducedFlicker &&
        this.lightEvent &&
        this.elapsed - this.lastScare < 0.6
          ? 8
          : 28;
      if (this.player.steps > this.nextStep + 1.6) {
        this.audio.cue("step");
        this.nextStep = this.player.steps;
      }
      if (!this.introPlayed && this.elapsed > 2) {
        this.introPlayed = true;
        this.voice("intro");
      }
      if (this.elapsed > this.nextHint) {
        this.nextHint = this.elapsed + 90;
        if (this.settings.autoHints)
          this.ui.toast(`${hint(this.state)} H opens optional hints.`);
      }
      this.currentTarget = this.findTarget();
      this.ui.interaction(
        this.hidden ? "Leave shelter" : (this.currentTarget?.label ?? null),
      );
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
        enemy: {
          state: this.enemy.state,
          position: { ...this.enemy.position },
          awareness: this.enemy.awareness,
          grace: this.enemy.grace,
          compromised: this.enemy.compromised,
          seesPlayer: this.enemy.seesPlayer,
        },
        hidden: this.hidden,
        tokens: this.tokens,
        machineUntil: this.machineUntil,
        posterChanged: this.posterChanged,
        settings: { ...this.settings },
        renderScale: this.renderer.getPixelRatio(),
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
      setRemaining: (seconds: number) => {
        this.state = {
          ...this.state,
          orientationSeconds: 0,
          remainingSeconds: seconds,
        };
      },
      setEnemy: (x: number, z: number, yaw = 0) => {
        this.enemy.reset(true);
        this.enemy.position = { x, z };
        this.enemy.yaw = yaw;
        this.enemy.grace = 0;
      },
      noise: (x: number, z: number, radius = 30) =>
        this.enemy.hear({ x, z, radius }),
      dispose: () => {
        this.destroyed = true;
        this.renderer.setAnimationLoop(null);
        this.renderer.dispose();
      },
    };
    Object.assign(window, { __LAST_METRO__: bridge });
  }
}
