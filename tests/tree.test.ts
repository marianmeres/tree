import { TreeNode } from "../src/tree/tree-node.ts";
import { Tree } from "../src/tree/tree.ts";
import { assert, assertEquals, assertThrows } from "@std/assert";

// https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Sorted_binary_tree_ALL_RGB.svg/586px-Sorted_binary_tree_ALL_RGB.svg.png
const _createTree = (readonly = false) => {
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H

	// FBADCEGIH - pre order
	// ACEDBHIGF - post order

	const f = new TreeNode("F");
	const b = f.appendChild("B");
	const g = f.appendChild("G");
	const a = b.appendChild("A");
	const d = b.appendChild("D");
	const c = d.appendChild("C");
	const e = d.appendChild("E");
	const i = g.appendChild("I");
	const h = i.appendChild("H");

	const tree = new Tree<string>(f, readonly);

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
		tree,
		expected,
        a, b, c, d, e, f, g, h, i
	};
};

Deno.test("node sanity check", () => {
	const n = new TreeNode("a");
	assertEquals(n.value, "a");
	assert(n.isRoot);
	assert(n.isLeaf);
	assertEquals(n.depth, 0);

	// tree must not exists
	assert(!n.tree);

	const n2 = new TreeNode({ foo: "bar" });
	assertEquals(n2.value.foo, "bar");

	// ids exists but are not equal
	assert(n.id && n2.id && n.id !== n2.id);

	// append child
	const b = n.appendChild("b");
	assertEquals(b.value, "b");
	assertEquals(n.children[0].value, "b");
	assertEquals(b.depth, 1);
	assert(!b.isRoot);
	assertEquals(n.children.length, 1);

	// replace child
	const c = n.replaceChild(b.id, "c") as TreeNode<string>;
	assertEquals(n.children[0].value, "c" as any);
	assertEquals(n.children.length, 1);

	// remove child
	assert(n.removeChild(c.id));
	assert(!n.children.length);

	// remove non existing child throws
	assertThrows(() => !n.removeChild("foo"));
});

Deno.test("tree sanity check", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	assert(f.tree && i.tree && f.tree === i.tree);

	// clog('\n' + t.toString());
	assertEquals(t.toString(), expected);

	// find by id
	assertEquals(t.find(d.id)?.id, d.id);
	assertEquals(t.find(h.id)?.id, h.id);

	// find by value
	assertEquals(t.findAllBy("D")?.[0].id, d.id);
	assertEquals(t.findAllBy("H")?.[0].id, h.id);

	// sibling index check
	assertEquals(t.findAllBy("B")?.[0].siblingIndex, 0);
	assertEquals(t.findAllBy("G")?.[0].siblingIndex, 1);
	assertEquals(t.findAllBy("E")?.[0].siblingIndex, 1);
});

Deno.test("pre/post order traversal", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	assertEquals(
		[...t.preOrderTraversal()].map((n) => n?.value).join(""),
		"FBADCEGIH"
	);
	assertEquals(
		[...t.postOrderTraversal()].map((n) => n?.value).join(""),
		"ACEDBHIGF"
	);
});

Deno.test("breadth first level order", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	assertEquals(
		[...t.levelOrderTraversal()].map((n) => n?.value).join(""),
		"FBGADICEH"
	);
});

Deno.test("tree.toJSON", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	// shallow compare - must not be same instance
	assert(t.toJSON() !== t.toJSON());
	// but deep members are the same
	assertEquals(t.toJSON()?.id, t.toJSON()?.id);
	assertEquals(t.toJSON()?.value, t.toJSON()?.value);
	assertEquals(t.toJSON()?.children, t.toJSON()?.children);
});

Deno.test("dump, restore", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// clog(JSON.stringify(t.toJSON(), null, 3));
	const dump = t.dump();
	assert(typeof dump === "string");

	// restored from string (usual case)
	const restored = new Tree(null);
	restored.restore(dump);

	assertEquals(restored.toString(), expected);
	assertEquals(dump, restored.dump()); // checks ids as well

	// restore from raw DTO
	const restored2 = new Tree(null);
	restored2.restore(t.toJSON()!);

	assertEquals(restored2.toString(), expected);
	assertEquals(dump, restored2.dump()); // checks ids as well

	// check tree ref
	assertEquals(restored2?.root?.tree, restored2);
});

Deno.test("remove", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H

	t.remove(d.id);
	// clog(t.toString());
	// prettier-ignore
	assertEquals(t.toString(),
`F
    B
        A
    G
        I
            H`);

	t.remove(g.id);
	// prettier-ignore
	assertEquals(t.toString(), 
`F
    B
        A`);

	// remove root
	t.remove(t.findAllBy("F")?.[0].id!);
	assertEquals(t.toString(), "");
});

Deno.test("insert", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	t.insert(i.id, "X");
	assertEquals(t.toString(), `${expected}\n            X`);

	t.insert(d.id, "Y");
	assert(t.toString().includes("\n            E\n            Y\n    G"));
});

Deno.test("contains", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// root
	assert(t.contains(h.id));
	assert(f.contains(a.id));
	assert(!t.contains("foo"));

	// sub tree
	assert(d.contains(c.id));
	assert(d.contains(e.id));
	assert(!d.contains(f.id));
	assert(!d.contains(a.id));
	assert(!a.contains(g.id));

	// contains self must be false
	assert(!t.contains(f.id));
	assert(!t.contains(t.root?.id!));
	assert(!d.contains(d.id));

	// with specified max depth
	assert(t.contains(b.id, 1));
	assert(t.contains(g.id, 1));
	assert(!t.contains(a.id, 1)); // a is deeper than 1
	assert(!t.contains(e.id, 2)); // e is deeper than 1
});

Deno.test("has", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H

	assert(!t.has("F")); // root does not have self within childred

	assert(t.has("B"));
	assert(t.has("I"));
	assert(t.has("E"));

	assert(b.has("E"));
	assert(!b.has("G"));
	assert(!b.has("F"));

	// with max depth
	assert(t.has("B", 1));
	assert(!t.has("E", 1));

	// custom compare fn
	const compare = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
	assert(!t.has("b"));
	assert(t.has("b", 0, compare));
});

Deno.test("findAllBy", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// found deep
	let r = t.findAllBy("H");
	assertEquals(r.map((v) => v.value).join(""), "H");

	// found respecting max depth
	r = t.findAllBy("H", null, 1);
	assert(!r.length);
	r = t.findAllBy("G", null, 1);
	assertEquals(r.map((v) => v.value).join(""), "G");

	// not found
	r = f.findAllBy("X");
	assertEquals(r.map((v) => v.value).join(""), "");
});

Deno.test("move", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H
	// clog('\n' + t.toString());
	t.move(g.id, a.id);
	// clog('\n' + t.toString());

	// prettier-ignore
	assertEquals(t.toString(), 
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

Deno.test("move to self", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	assertThrows(() => t.move(g.id, g.id));
	assertEquals(t.toString(), expected); // no change
});

Deno.test("move to same parent", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	// this is a noop
	assertEquals(t.move(g.id, f.id), g);
	assert(t.toString(), expected); // no change
});

Deno.test("move down the path", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	assertThrows(() => !t.move(g.id, h.id));
	assertEquals(t.toString(), expected); // no change
});

Deno.test("move up the path", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H
	t.move(i.id, f.id);
	// clog(t.toString());

	// prettier-ignore
	assertEquals(t.toString(),
`F
    B
        A
        D
            C
            E
    G
    I
        H`);
});

Deno.test("clone", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	const clone = g.deepClone();

	assertEquals(g.value, clone.value);
	assert(g.id !== clone.id);

	assertEquals(g.children[0].value, clone.children[0].value); // i
	assert(g.children[0].id !== clone.children[0].id); // i

	assertEquals(
		g.children[0].children[0].value,
		clone.children[0].children[0].value
	); // h
	assert(g.children[0].children[0].id !== clone.children[0].children[0].id); // h

	// clog(JSON.stringify(g.toJSON(), null, 3));
	// clog(JSON.stringify(g.deepClone().toJSON(), null, 3));
});

Deno.test("copy", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H
	t.copy(g.id, a.id);
	// clog(t.toString());

	// prettier-ignore
	assertEquals(t.toString(), 
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

Deno.test("copy to self", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	t.copy(g.id, g.id);
	// clog(t.toString());
	// prettier-ignore
	assertEquals(t.toString(), 
`F
    B
        A
        D
            C
            E
    G
        I
            H
        G
            I
                H`);
});

Deno.test("copy to same parent", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	t.copy(i.id, g.id);
	// clog(t.toString());
	// prettier-ignore
	assertEquals(t.toString(), 
`F
    B
        A
        D
            C
            E
    G
        I
            H
        I
            H`);
});

Deno.test("copy down the path", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H
	t.copy(g.id, h.id);
	// clog(t.toString());

	// prettier-ignore
	assertEquals(t.toString(), 
`F
    B
        A
        D
            C
            E
    G
        I
            H
                G
                    I
                        H`);
});

Deno.test("siblings", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	assertEquals(c.nextSibling()?.value, "E");
	assertEquals(g.previousSibling()?.value, "B");

	// move sibling index
	const x = f.appendChild("X");
	f.appendChild("Y");
	f.appendChild("Z");
	// clog('\n' + t.toString());

	// move to start
	g.moveSiblingIndex(0);
	assertEquals(g.siblingIndex, 0);

	// move to end
	g.moveSiblingIndex(999);
	// @ts-ignore
	assertEquals(g.siblingIndex, 4);

	// move two steps front-ward
	g.moveSiblingIndex(-2);
	assertEquals(g.siblingIndex, 2);

	// move insane steps front-ward
	g.moveSiblingIndex(-99999);
	assertEquals(g.siblingIndex, 0);

	// clog('\n' + t.toString());
});

Deno.test("lca", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	//            F
	//        /     \
	//      B         G
	//    /   \         \
	//  A       D        I
	//        /   \        \
	//      C       E       H
	assertEquals(t.findLCA(a.id, e.id), b);
	assertEquals(t.findLCA(a.id, d.id), b);
	assertEquals(t.findLCA(b.id, b.id), b);
	assertEquals(t.findLCA(a.id, h.id), f);
	assertEquals(t.findLCA(f.id, f.id), f);
	assertEquals(t.findLCA(c.id, e.id), d);
	assertThrows(() => t.findLCA("foo", f.id) === null);
	assertThrows(() => t.findLCA("foo", "bar") === null);
});

Deno.test("size", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	assertEquals(new Tree().size(), 0);
	assertEquals(t.size(), 9);
	assertEquals(t.size(f), 9);
	assertEquals(t.size(b), 5);
	assertEquals(t.size(d), 3);
	assertEquals(t.size(i), 2);
	assertEquals(t.size(h), 1);
	assertEquals(t.size(new TreeNode("foo")), 0);
});

Deno.test("readonly", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree(true);

	assert(t.readonly);
	assert(t.toString() === expected);

	// each node must be marked as readonly as well
	[a, b, c, d, e, f, g, h, i].forEach((n) => {
		assert(n.readonly, `${n.value} is not readonly`);
		assertThrows(() => n.appendChild("a"), `${n.value} appendChild`);
		assertThrows(() => n.removeChild("a"), `${n.value} removeChild`);
		assertThrows(() => n.replaceChild("a", "d"), `${n.value} replaceChild`);
		assertThrows(() => n.resetChildren(), `${n.value} resetChildren`);
		assertThrows(() => n.moveSiblingIndex(1), `${n.value} moveSiblingIndex`);
	});

	assertThrows(() => t.appendChild("foo"));
	assertThrows(() => t.insert(d.id, "foo"));
	assertThrows(() => t.remove(d.id));
	assertThrows(() => t.move(i.id, b.id));
	assertThrows(() => t.copy(i.id, b.id));

	// must work via factory param as well
	const t2 = Tree.factory<string>(_createTree().tree.dump(), true);
	assert(t2.readonly);
	assertEquals(t2.toString(), expected);
});

Deno.test("readme example", () => {
	const tree = new Tree<string>();

	// no root node was provided yet, so the tree is zero in size
	assert(!tree.root);
	assertEquals(tree.size(), 0);

	// add some nodes

	// "A" below will become "root" as it is the first child (the tree must have exactly 1 root)
	const A = tree.appendChild("A");
	assertEquals(tree.root, A);

	const AA = tree.appendChild("AA");
	const AB = tree.appendChild("AB");

	// now we're appeding to nodes directy
	const AAA = AA.appendChild("AAA");
	const AAB = AA.appendChild("AAB");
	const ABA = AB.appendChild("ABA");
	const ABB = AB.appendChild("ABB");

	// there is also `tree.insert` method, which works similar (we can specify the parent node)
	const AAAA = tree.insert(AAA.id, "AAAA");
	const AAAB = tree.insert(AAA.id, "AAAB");
	// const AAAA = AAA.appendChild('AAAA'); // same effect as above
	// const AAAB = AAA.appendChild('AAAB');

	// check visually (the `toString` provides simple human readable plain text representation)
	// prettier-ignore
	assertEquals(tree.toString(), `
A
    AA
        AAA
            AAAA
            AAAB
        AAB
    AB
        ABA
        ABB
	`.trim());

	// we have 9 nodes in total
	assertEquals(tree.size(), 9);

	// sub-brach AA has 5 (`size` accepts "fromNode" param)
	assertEquals(tree.size(AA), 5);

	// Each node has a unique string "id" (which is auto-created). Most lookup methods are
	// based on this id. Node also has a "value" which any raw value and which can be
	// used in lookups as well. In this example, the values are plain strings.

	// lookups
	// @ts-ignore
	assertEquals(tree.find(A.id), A);
	assertEquals(tree.findAllBy("AB"), [AB]);
	// tree.findBy(propertyValue, propertyName) if the values were objects

	// contains lookup
	assert(tree.contains(AB.id));
	assert(!AB.contains(AAB.id));

	// the tree is fully serializable
	const dump = tree.dump();
	assert(typeof dump === "string");
	// const restored = new Tree().restore(dump);
	const restored = Tree.factory<string>(dump);
	assertEquals(tree.toString(), restored.toString());

	// traversal...
	for (let node of tree.preOrderTraversal()) {
		// ...
	}

	// lowest common ancestor lookup
	// @ts-ignore
	assertEquals(tree.findLCA(AAB.id, AAAB.id), AA);

	// node/subtree removal
	// tree.remove('nodeId');
	// node.removeChild(id: string)
	// node.replaceChild(id: string, valueOrNode: T | TreeNode<T>)
	// node.resetChildren(values: (T | TreeNode<T>)[] = [])

	// node/subtree move and copy
	// tree.move(sourceNodeId, targetNodeId);
	// tree.copy(sourceNodeId, targetNodeId);

	// node siblings
	// @ts-ignore
	assertEquals(AAAA.nextSibling(), AAAB);
	// @ts-ignore
	assertEquals(AAAB.previousSibling(), AAAA);

	// siblings reorder
	// @ts-ignore
	assertEquals(AAAB.siblingIndex, 1);
	// @ts-ignore
	assertEquals(AAAB.moveSiblingIndex(0).siblingIndex, 0);

	// and more...
});

// --- regression tests for bug fixes (v2.3.0) ---

Deno.test("findLCA: ancestor-descendant returns the ancestor", () => {
	let { tree: t, a, b, f } = _createTree();
	// B is an ancestor of A; LCA should be B (not root F).
	assertEquals(t.findLCA(a.id, b.id), b);
	assertEquals(t.findLCA(b.id, a.id), b);
	// Root is an ancestor of any node; LCA(root, any) === root.
	assertEquals(t.findLCA(f.id, a.id), f);
});

Deno.test("TreeNode.root returns self for root / detached nodes", () => {
	const lonely = new TreeNode("x");
	assertEquals(lonely.root, lonely);

	const t = new Tree<string>();
	const r = t.appendChild("R");
	assertEquals(r.root, r);
});

Deno.test("appendChild rejects duplicate descendants and ancestors", () => {
	const t = new Tree<string>();
	const root = t.appendChild("R");
	const child = root.appendChild("C");
	const grand = child.appendChild("G");

	// Appending an already-attached node (direct child) → duplicate.
	assertThrows(() => root.appendChild(child));
	// Appending a deeper descendant → duplicate.
	assertThrows(() => root.appendChild(grand));
	// Appending an ancestor → cycle.
	assertThrows(() => child.appendChild(root));
	// Appending self.
	assertThrows(() => child.appendChild(child));
});

Deno.test("appendChild of detached TreeNode is allowed", () => {
	const t = new Tree<string>();
	const root = t.appendChild("R");
	const c = root.appendChild("C");

	const detached = new TreeNode("D");
	// fresh detached node can be appended anywhere
	c.appendChild(detached);
	assertEquals(c.children.length, 1);
	assertEquals(detached.parent, c);
	assertEquals(detached.tree, t);
});

Deno.test("appendChild rejects nodes from a different tree", () => {
	const tA = new Tree<string>();
	tA.appendChild("A");
	const tB = new Tree<string>();
	const rB = tB.appendChild("B");
	const bChild = rB.appendChild("B1");

	assertThrows(() => tA.root!.appendChild(bChild));
	// tB is untouched
	assertEquals(tB.root!.children.length, 1);
	assertEquals(tB.root!.children[0], bChild);
});

Deno.test("removed node is fully detached (parent, tree cleared)", () => {
	const t = new Tree<string>();
	const r = t.appendChild("R");
	const c = r.appendChild("C");
	const g = c.appendChild("G");

	t.remove(c.id);
	assertEquals(c.parent, null);
	assertEquals(c.tree, null);
	// subtree is also detached
	assertEquals(g.tree, null);
});

Deno.test("TreeNode.toJSON returns plain DTO (no TreeNode instances)", () => {
	const t = new Tree<string>();
	const r = t.appendChild("R");
	r.appendChild("C1").appendChild("G1");
	r.appendChild("C2");

	const dto = t.root!.toJSON();
	assert(!(dto.children[0] instanceof TreeNode));
	assert(!(dto.children[0].children[0] instanceof TreeNode));
	// Mutating the DTO must NOT affect the live tree.
	dto.children.push({ id: "fake", value: "fake", children: [] });
	assertEquals(t.root!.children.length, 2);
});

Deno.test("deepClone returns a fully detached node", () => {
	const t = new Tree<string>();
	const r = t.appendChild("R");
	const c = r.appendChild("C");
	c.appendChild("G");

	const clone = c.deepClone();
	assertEquals(clone.parent, null);
	assertEquals(clone.tree, null);
	// But subtree is internally wired.
	assertEquals(clone.children[0].parent, clone);
	// Ids are fresh.
	assert(clone.id !== c.id);
	assert(clone.children[0].id !== c.children[0].id);
});

Deno.test("findAllBy uses custom comparator for self-match too", () => {
	const r = new TreeNode({ name: "Root" });
	r.appendChild({ name: "Child" });
	const ci = (a: any, b: any) => a.name.toLowerCase() === b.name.toLowerCase();
	const hits = r.findAllBy({ name: "root" }, null, 0, ci);
	assertEquals(hits.length, 1);
	assertEquals(hits[0], r);
});

Deno.test("readonly: appendChild blocked on empty tree", () => {
	const t = new Tree<string>(null, true);
	assertThrows(() => t.appendChild("x"));
});

Deno.test("readonly: root removal is blocked", () => {
	const t = new Tree<string>();
	t.appendChild("R");
	const frozen = Tree.factory<string>(t.dump(), true);
	assertThrows(() => frozen.remove(frozen.root!.id));
	assert(frozen.root); // still there
});

Deno.test("readonly: direct children array mutation throws (array is frozen)", () => {
	const t = new Tree<string>();
	t.appendChild("R").appendChild("C");
	const frozen = Tree.factory<string>(t.dump(), true);
	// children array is frozen; push/splice must throw (or be silently ignored in sloppy mode).
	assertThrows(() => frozen.root!.children.push(new TreeNode("x")));
	assertThrows(() =>
		(frozen.root!.children as TreeNode<string>[]).splice(0, 1)
	);
	assertEquals(frozen.root!.children.length, 1);
});

Deno.test("size(): foreign subtree returns 0 even when it has children", () => {
	const t = new Tree<string>();
	t.appendChild("R");
	const foreign = new TreeNode("X");
	foreign.appendChild("Y");
	foreign.appendChild("Z");
	assertEquals(t.size(foreign), 0);
});

Deno.test("traversal: empty tree yields nothing (no null)", () => {
	const t = new Tree<string>();
	assertEquals([...t.preOrderTraversal()].length, 0);
	assertEquals([...t.postOrderTraversal()].length, 0);
	assertEquals([...t.levelOrderTraversal()].length, 0);
});

Deno.test("bulk flat append is not O(n^2)", () => {
	const N = 5000;
	const start = performance.now();
	const t = new Tree<number>();
	const r = t.appendChild(0);
	for (let k = 1; k < N; k++) r.appendChild(k);
	const ms = performance.now() - start;
	// On a typical machine this is ~5ms. A generous 500ms upper bound catches
	// accidental regressions to the old O(n^2) behavior (which was ~120ms at N=5000
	// and would be multiple seconds at N=20000).
	assert(ms < 500, `flat append too slow: ${ms}ms`);
	assertEquals(t.size(), N);
});

Deno.test("replaceChild returns the replacement (no longer `false`)", () => {
	const t = new Tree<string>();
	const r = t.appendChild("R");
	const c = r.appendChild("C");
	const replaced = r.replaceChild(c.id, "NEW");
	assertEquals(replaced.value, "NEW");
	assertEquals(replaced.parent, r);
	// Old child is detached.
	assertEquals(c.parent, null);
});

