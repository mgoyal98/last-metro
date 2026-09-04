import RAPIER from "@dimforge/rapier3d-compat";

export class Physics {
  readonly world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  private readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  constructor() {
    this.body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        1.5,
        0.9,
        15,
      ),
    );
    this.collider = this.world.createCollider(
      RAPIER.ColliderDesc.capsule(0.55, 0.28),
      this.body,
    );
    this.controller = this.world.createCharacterController(0.02);
    this.controller.setSlideEnabled(true);
    this.controller.enableSnapToGround(0.15);
  }
  box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ): RAPIER.Collider {
    return this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(x, y, z),
    );
  }
  remove(collider: RAPIER.Collider): void {
    this.world.removeCollider(collider, true);
  }
  move(x: number, z: number, dt: number): void {
    this.controller.computeColliderMovement(this.collider, {
      x: x * dt,
      y: -0.12,
      z: z * dt,
    });
    const delta = this.controller.computedMovement();
    const p = this.body.translation();
    this.body.setNextKinematicTranslation({
      x: p.x + delta.x,
      y: p.y + delta.y,
      z: p.z + delta.z,
    });
    this.world.timestep = dt;
    this.world.step();
  }
  teleport(x: number, z: number): void {
    this.body.setTranslation({ x, y: 0.9, z }, true);
    this.body.setNextKinematicTranslation({ x, y: 0.9, z });
    this.world.step();
  }
  get position(): RAPIER.Vector {
    return this.body.translation();
  }
}
export async function initializePhysics(): Promise<Physics> {
  await RAPIER.init();
  return new Physics();
}
