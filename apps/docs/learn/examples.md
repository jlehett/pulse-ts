# Examples

Short, copy‑pasteable examples you can adapt.

## Counter state

```ts
function Counter() {
  const [get, set] = useState('count', 0);
  useFrameUpdate((dt) => set((c) => c + dt));
}
```

## Parent/child composition

```ts
function Parent() {
  useChild(Child, { label: 'hello' });
}

function Child({ label }: { label: string }) {
  useInit(() => console.log(label));
}
```

## Service usage

```ts
class GameState extends Service {
  private score = 0;
  add(points: number) { this.score += points; }
  get() { return this.score; }
}

function ScoreDisplay() {
  const gs = useService(GameState);
  useFrameUpdate(() => console.log(gs.get()));
}
```
