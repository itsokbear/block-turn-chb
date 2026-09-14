import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the actual React pointer handlers, including events browsers can send
// to disabled buttons; native click suppression does not cover pointer events.
const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const start = page.indexOf('function dragHandlers(');
const end = page.indexOf('\n useEffect(', start);
const { outputText } = ts.transpileModule(page.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
});
function fixture(disabled) {
  const active = { current: null };
  let selected = null;
  let captured = false;
  const handlers = new Function('active', 'setSelected', 'setDrag', `
    const swapping=null,modal=null,over=false,rerollMode=false;
    ${outputText}
    return dragHandlers(-1);
  `)(active, update => { selected = update(selected); }, () => {});
  const event = {
    button: 0, pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 20,
    preventDefault() {},
    currentTarget: {
      disabled,
      setPointerCapture() { captured = true; },
      getBoundingClientRect() { return { left: 0, width: 40 }; },
    },
  };
  return { handlers, event, active, selected: () => selected, captured: () => captured };
}
test('unavailable bomb ignores pointer down/up and cannot become armed', () => {
  const f = fixture(true);
  f.handlers.onPointerDown(f.event);
  f.handlers.onPointerUp(f.event);
  assert.equal(f.active.current, null);
  assert.equal(f.captured(), false);
  assert.equal(f.selected(), null);
});
test('available bomb still captures touch and toggles selection on taps', () => {
  const f = fixture(false);
  f.handlers.onPointerDown(f.event);
  assert.equal(f.captured(), true);
  f.handlers.onPointerUp(f.event);
  assert.equal(f.selected(), -1);
  f.handlers.onPointerDown(f.event);
  f.handlers.onPointerUp(f.event);
  assert.equal(f.selected(), null);
});
