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
	assert(n.value === "a");
	assert(n.isRoot);
	assert(n.isLeaf);
	assert(n.depth === 0);

	// tree must not exists
	assert(!n.tree);

	const n2 = new TreeNode({ foo: "bar" });
	assert(n2.value.foo === "bar");

	// keys exists but are not equal
	assert(n.key && n2.key && n.key !== n2.key);

	// append child
	const b = n.appendChild("b");
	assert(b.value === "b");
	assert(n.children[0].value === "b");
	assert(b.depth === 1);
	assert(!b.isRoot);
	assert(n.children.length === 1);

	// replace child
	const c = n.replaceChild(b.key, "c") as TreeNode<string>;
	assert(n.children[0].value === ("c" as any));
	assert(n.children.length === 1);

	// remove child
	assert(n.removeChild(c.key));
	assert(!n.children.length);

	// remove non existing child throws
	assertThrows(() => !n.removeChild("foo"));
});

Deno.test("tree sanity check", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	assert(f.tree && i.tree && f.tree === i.tree);

	// clog('\n' + t.toString());
	assert(t.toString() === expected);

	// find by key
	assert(t.find(d.key)?.key === d.key);
	assert(t.find(h.key)?.key === h.key);

	// find by value
	assert(t.findBy("D")?.key === d.key);
	assert(t.findBy("H")?.key === h.key);

	// sibling index check
	assert(t.findBy("B")?.siblingIndex === 0);
	assert(t.findBy("G")?.siblingIndex === 1);
	assert(t.findBy("E")?.siblingIndex === 1);
});

Deno.test("pre/post order traversal", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	assert(
		[...t.preOrderTraversal()].map((n) => n?.value).join("") === "FBADCEGIH"
	);
	assert(
		[...t.postOrderTraversal()].map((n) => n?.value).join("") === "ACEDBHIGF"
	);
});

Deno.test("tree.toJSON", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	// shallow compare - must not be same instance
	assert(t.toJSON() !== t.toJSON());
	// but deep members are the same
	assert(t.toJSON()?.key === t.toJSON()?.key);
	assert(t.toJSON()?.value === t.toJSON()?.value);
	assert(t.toJSON()?.children === t.toJSON()?.children);
});

Deno.test("dump, restore", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// clog(JSON.stringify(t.toJSON(), null, 3));
	const dump = t.dump();
	assert(typeof dump === "string");

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

	// check tree ref
	assert(restored2?.root?.tree === restored2);
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

	t.remove(d.key);
	// clog(t.toString());
	// prettier-ignore
	assert(t.toString() === 
`F
    B
        A
    G
        I
            H`);

	t.remove(g.key);
	// prettier-ignore
	assert(t.toString() === 
`F
    B
        A`);

	// remove root
	t.remove(t.findBy("F")?.key!);
	assert(t.toString() === "");
});

Deno.test("insert", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	t.insert(i.key, "X");
	assert(t.toString() === `${expected}\n            X`);

	t.insert(d.key, "Y");
	assert(t.toString().includes("\n            E\n            Y\n    G"));
});

Deno.test("contains", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	// root
	assert(t.contains(h.key));
	assert(f.contains(a.key));
	assert(!t.contains("foo"));

	// sub tree
	assert(d.contains(c.key));
	assert(d.contains(e.key));
	assert(!d.contains(f.key));
	assert(!d.contains(a.key));
	assert(!a.contains(g.key));

	// contains self must be false
	assert(!t.contains(f.key));
	assert(!t.contains(t.root?.key!));
	assert(!d.contains(d.key));
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
	t.move(g.key, a.key);
	// clog('\n' + t.toString());

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

Deno.test("move to self", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	assertThrows(() => t.move(g.key, g.key));
	assert(t.toString() === expected); // no change
});

Deno.test("move to same parent", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	// assertThrows(() => !t.move(g.key, f.key));
	// this is a noop
	assert(t.move(g.key, f.key) === g);
	assert(t.toString() === expected); // no change
});

Deno.test("move down the path", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	assertThrows(() => !t.move(g.key, h.key));
	assert(t.toString() === expected); // no change
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
	t.move(i.key, f.key);
	// clog(t.toString());

	// prettier-ignore
	assert(t.toString() ===
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

	assert(g.value === clone.value);
	assert(g.key !== clone.key);

	assert(g.children[0].value === clone.children[0].value); // i
	assert(g.children[0].key !== clone.children[0].key); // i

	assert(
		g.children[0].children[0].value === clone.children[0].children[0].value
	); // h
	assert(g.children[0].children[0].key !== clone.children[0].children[0].key); // h

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

Deno.test("copy to self", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();
	t.copy(g.key, g.key);
	// clog(t.toString());
	// prettier-ignore
	assert(t.toString() === 
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
	t.copy(i.key, g.key);
	// clog(t.toString());
	// prettier-ignore
	assert(t.toString() === 
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
	t.copy(g.key, h.key);
	// clog(t.toString());

	// prettier-ignore
	assert(t.toString() === 
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

	assert(c.nextSibling()?.value === "E");
	assert(g.previousSibling()?.value === "B");

	// move sibling index
	const x = f.appendChild("X");
	f.appendChild("Y");
	f.appendChild("Z");
	// clog('\n' + t.toString());

	// move to start
	g.moveSiblingIndex(0);
	assert(g.siblingIndex === 0);

	// move to end
	g.moveSiblingIndex(999);
	// @ts-ignore
	assert(g.siblingIndex === 4);

	// move two steps front-ward
	g.moveSiblingIndex(-2);
	assert(g.siblingIndex === 2);

	// move insane steps front-ward
	g.moveSiblingIndex(-99999);
	assert(g.siblingIndex === 0);

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
	assert(t.findLCA(a.key, e.key) === b);
	assert(t.findLCA(a.key, d.key) === b);
	assert(t.findLCA(b.key, b.key) === b);
	assert(t.findLCA(a.key, h.key) === f);
	assert(t.findLCA(f.key, f.key) === f);
	assert(t.findLCA(c.key, e.key) === d);
	assertThrows(() => t.findLCA("foo", f.key) === null);
	assertThrows(() => t.findLCA("foo", "bar") === null);
});

Deno.test("size", () => {
	let { tree: t, expected, a, b, c, d, e, f, g, h, i } = _createTree();

	assert(new Tree().size() === 0);
	assert(t.size() === 9);
	assert(t.size(f) === 9);
	assert(t.size(b) === 5);
	assert(t.size(d) === 3);
	assert(t.size(i) === 2);
	assert(t.size(h) === 1);
	assert(t.size(new TreeNode("foo")) === 0);
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
	assertThrows(() => t.insert(d.key, "foo"));
	assertThrows(() => t.remove(d.key));
	assertThrows(() => t.move(i.key, b.key));
	assertThrows(() => t.copy(i.key, b.key));

	// must work via factory param as well
	const t2 = Tree.factory<string>(_createTree().tree.dump(), true);
	assert(t2.readonly);
	assert(t2.toString() === expected);
});

Deno.test("readme example", () => {
	const tree = new Tree<string>();

	// no root node was provided yet, so the tree is zero in size
	assert(!tree.root);
	assert(tree.size() === 0);

	// add some nodes

	// "A" below will become "root" as it is the first child (the tree must have exactly 1 root)
	const A = tree.appendChild("A");
	assert(tree.root === A);

	const AA = tree.appendChild("AA");
	const AB = tree.appendChild("AB");

	// now we're appeding to nodes directy
	const AAA = AA.appendChild("AAA");
	const AAB = AA.appendChild("AAB");
	const ABA = AB.appendChild("ABA");
	const ABB = AB.appendChild("ABB");

	// there is also `tree.insert` method, which works similar (we can specify the parent node)
	const AAAA = tree.insert(AAA.key, "AAAA");
	const AAAB = tree.insert(AAA.key, "AAAB");
	// const AAAA = AAA.appendChild('AAAA'); // same effect as above
	// const AAAB = AAA.appendChild('AAAB');

	// check visually (the `toString` provides simple human readable plain text representation)
	// prettier-ignore
	assert(tree.toString() === `
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
	assert(tree.size() === 9);

	// sub-brach AA has 5 (`size` accepts "fromNode" param)
	assert(tree.size(AA) === 5);

	// Each node has a unique string "key" (which is auto-created). Most lookup methods are
	// based on this key. Node also has a "value" which any raw value and which can be
	// used in lookups as well. In this example, the values are plain strings.

	// lookups
	// @ts-ignore
	assert(tree.find(A.key) === A);
	assert(tree.findBy("AB") === AB);
	// tree.findBy(propertyValue, propertyName) if the values were objects

	// contains lookup
	assert(tree.contains(AB.key));
	assert(!AB.contains(AAB.key));

	// the tree is fully serializable
	const dump = tree.dump();
	assert(typeof dump === "string");
	// const restored = new Tree().restore(dump);
	const restored = Tree.factory<string>(dump);
	assert(tree.toString() === restored.toString());

	// traversal...
	for (let node of tree.preOrderTraversal()) {
		// ...
	}

	// lowest common ancestor lookup
	// @ts-ignore
	assert(tree.findLCA(AAB.key, AAAB.key) === AA);

	// node/subtree removal
	// tree.remove('nodeKey');
	// node.removeChild(key: string)
	// node.replaceChild(key: string, valueOrNode: T | TreeNode<T>)
	// node.resetChildren(values: (T | TreeNode<T>)[] = [])

	// node/subtree move and copy
	// tree.move(sourceNodeKey, targetNodeKey);
	// tree.copy(sourceNodeKey, targetNodeKey);

	// node siblings
	// @ts-ignore
	assert(AAAA.nextSibling() === AAAB);
	// @ts-ignore
	assert(AAAB.previousSibling() === AAAA);

	// siblings reorder
	// @ts-ignore
	assert(AAAB.siblingIndex === 1);
	// @ts-ignore
	assert(AAAB.moveSiblingIndex(0).siblingIndex === 0);

	// and more...
});
