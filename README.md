# @marianmeres/tree

Base [tree](<https://en.wikipedia.org/wiki/Tree_(data_structure)>) class providing
common traversal, lookup and node manipulation operations.

## Install

```shell
$ npm i @marianmeres/tree
```

## Example usage

```typescript
import { Tree, TreeNode } from '@marianmeres/tree';

const tree = new Tree<string>();

// no root node was provided yet, so the tree is zero in size
assert(!tree.root);
assert(tree.size() === 0);

// add some nodes

// "A" below will become "root" as it is the first child (the tree must have exactly 1 root)
const A = tree.appendChild('A');
tree.appendChild(new TreeNode('A')); // alternative to above
assert(tree.root === A);

const AA = tree.appendChild('AA');
const AB = tree.appendChild('AB');

// now append to nodes directy
const AAA = AA.appendChild('AAA');
const AAB = AA.appendChild('AAB');
const ABA = AB.appendChild('ABA');
const ABB = AB.appendChild('ABB');

// there is also `tree.insert` method, which works similar (we can specify the parent node)
const AAAA = tree.insert(AAA.key, 'AAAA');
const AAAB = tree.insert(AAA.key, 'AAAB');
// const AAAA = AAA.appendChild('AAAA'); // same effect as above
// const AAAB = AAA.appendChild('AAAB');

// check visually (the `toString` provides simple human readable plain text representation)
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
// based on this key. Node also has a "value" which is any raw value and which can be
// used in lookups as well. In this example, the values are plain strings.

// lookups
assert(tree.find(A.key) === A);
assert(tree.findBy('AB') === AB);
tree.findBy(propertyValue, propertyName) // if the values were objects

// contains lookup
assert(tree.contains(AB.key));
assert(!AB.contains(AAB.key));

// the tree is fully serializable (internally via JSON.stringify/parse)
const dump = tree.dump();
assert(typeof dump === 'string');
const restored = new Tree().restore(dump);
// const restored = Tree.factory<string>(dump); // same as above
assert(tree.toString() === restored.toString());

// traversal...
for (let node of tree.preOrderTraversal()) {
    // each node exposes these props
    node.children // array of direct child nodes
    node.depth // number
    node.isLeaf // boolean
    node.isRoot // boolean
    node.key // auto-generated unique key
    node.parent // reference to parent node
    node.path // hierarchy path to node as array of nodes from root (top-down)
    node.root // refererence to root node
    node.siblings // array of siblings
    node.tree // reference to the tree the node belongs to
    node.value // actual stored value (string in our example)

    // and methods
    node.deepClone()
    node.toJSON()
    node.appendChild(valueOrNode: T | TreeNode<T>)
    node.removeChild(key: string)
    node.replaceChild(key: string, valueOrNode: T | TreeNode<T>)
    node.resetChildren(valuesOrNodes: (T | TreeNode<T>)[] = [])
    node.previousSibling()
    node.nextSibling()
    node.moveSiblingIndex(toIndex: number)
    node.contains(key: string)
    node.toString()
}

// lowest common ancestor lookup
assert(tree.findLCA(AAB.key, AAAB.key) === AA);

// node/subtree removal
tree.remove('nodeKey');
node.removeChild(key: string)
node.replaceChild(key: string, valueOrNode: T | TreeNode<T>)
node.resetChildren(values: (T | TreeNode<T>)[] = [])

// node/subtree move and copy
tree.move(sourceNodeKey: string, targetNodeKey: string);
tree.copy(sourceNodeKey: string, targetNodeKey: string);

// node siblings
assert(AAAA.nextSibling() === AAAB);
assert(AAAB.previousSibling() === AAAA);

// siblings reorder
assert(AAAB.siblingIndex === 1);
assert(AAAB.moveSiblingIndex(0).siblingIndex === 0);

// tree can be marked as readonly where ALL modifying operations fail, e.g.
const t = Tree.factory<string>(dump, true);
assert(t.readonly);
assert.throws(() => t.appendChild('foo'));
// ...
```
