import { createClog } from '@marianmeres/clog';
import { TestRunner } from '@marianmeres/test-runner';
import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Tree, TreeNode } from '../src/index.js';
import exp from 'node:constants';

const clog = createClog(path.basename(fileURLToPath(import.meta.url)));
const suite = new TestRunner(path.basename(fileURLToPath(import.meta.url)));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Sorted_binary_tree_ALL_RGB.svg/586px-Sorted_binary_tree_ALL_RGB.svg.png
const _createTree = () => {
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H

	const f = new TreeNode('F');
	const b = f.appendChild('B');
	const g = f.appendChild('G');
	const a = b.appendChild('A');
	const d = b.appendChild('D');
	const c = d.appendChild('C');
	const e = d.appendChild('E');
	const i = g.appendChild('I');
	const h = i.appendChild('H');

	// prettier-ignore
	const expected = 
`F
    B
        A
        D
            C
            E
    G
        I
            H`;

	// prettier-ignore
	return {
		tree: new Tree<string>(f),
		expected,
        a, b, c, d, e, f, g, h, i
	};
};

suite.test('node sanity check', () => {
	const n = new TreeNode('a');
	assert(n.value === 'a');
	assert(n.isRoot);
	assert(n.isLeaf);
	assert(n.depth === 0);

	const n2 = new TreeNode({ foo: 'bar' });
	assert(n2.value.foo === 'bar');

	// keys exists but are not equal
	assert(n.key && n2.key && n.key !== n2.key);

	// append child
	const b = n.appendChild('b');
	assert(b.value === 'b');
	assert(n.children[0].value === 'b');
	assert(b.depth === 1);
	assert(!b.isRoot);
	assert(n.children.length === 1);

	// replace child
	const c = n.replaceChild(b.key, 'c') as TreeNode<string>;
	assert(n.children[0].value === ('c' as any));
	assert(n.children.length === 1);

	// remove child
	assert(n.removeChild(c.key));
	assert(!n.children.length);

	// remove non existing child returns false
	assert(!n.removeChild('foo'));
});

suite.test('tree sanity check', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// clog('\n' + t.toString());
	assert(t.toString() === expected);

	// find by key
	assert(t.find(d.key).key === d.key);
	assert(t.find(h.key).key === h.key);

	// find by value
	assert(t.findBy('D').key === d.key);
	assert(t.findBy('H').key === h.key);
});

suite.test('dump, restore', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// clog(JSON.stringify(t.toJSON(), null, 3));
	const dump = t.dump();
	assert(typeof dump === 'string');

	// restored from string (usual case)
	const restored = new Tree(null);
	restored.restore(dump);

	assert(restored.toString() === expected);
	assert(dump === restored.dump()); // checks keys as well

	// restore from raw DTO
	const restored2 = new Tree(null);
	restored2.restore(t.toJSON()!);

	assert(restored2.toString() === expected);
	assert(dump === restored2.dump()); // checks keys as well
});

suite.test('remove', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	t.remove(d.key);
	t.remove(g.key);

	assert(t.toString() === 'F\n    B\n        A');

	// remove root
	t.remove(t.findBy('F')?.key);
	assert(t.toString() === '');
});

suite.test('insert', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	t.insert(i.key, 'X');
	assert(t.toString() === `${expected}\n            X`);

	t.insert(d.key, 'Y');
	assert(t.toString().includes('\n            E\n            Y\n    G'));
});

suite.test('contains', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// root
	assert(t.contains(h.key));
	assert(f.contains(a.key));
	assert(!t.contains('foo'));

	// sub tree
	assert(d.contains(c.key));
	assert(d.contains(e.key));
	assert(!d.contains(f.key));
	assert(!d.contains(a.key));
	assert(!a.contains(g.key));

	// contains self must be false
	assert(!t.contains(t.root?.key!));
	assert(!d.contains(d.key));
});

suite.test('move', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	t.move(g.key, a.key);

	// prettier-ignore
	assert(t.toString() === 
`F
    B
        A
            G
                I
                    H
        D
            C
            E`);
});

suite.test('clone', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	const clone = g.deepClone();

	assert(g.value === clone.value);
	assert(g.key !== clone.key);
	assert(g.children[0].value === clone.children[0].value);
	assert(g.children[0].key !== clone.children[0].key);

	// clog(JSON.stringify(g.toJSON(), null, 3));
	// clog(JSON.stringify(g.deepClone().toJSON(), null, 3));
});

suite.test('copy', () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	t.copy(g.key, a.key);
	// clog(t.toString());

	// prettier-ignore
	assert(t.toString() === 
`F
    B
        A
            G
                I
                    H
        D
            C
            E
    G
        I
            H`);
});

export default suite;
