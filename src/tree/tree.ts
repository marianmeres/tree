import { TreeNode, TreeNodeDTO } from './tree-node.js';

// inspiration https://www.30secondsofcode.org/js/s/data-structures-tree/

export class Tree<T> {
	constructor(protected _root: TreeNode<T> | null) {}

	get root() {
		return this._root;
	}

	// https://en.wikipedia.org/wiki/Tree_traversal
	// Depth-first, pre-order
	*preOrderTraversal(node?: TreeNode<T> | null) {
		node ??= this._root;
		yield node;
		if (node?.children.length) {
			for (let child of node.children) {
				yield* this.preOrderTraversal(child);
			}
		}
	}

	// https://en.wikipedia.org/wiki/Tree_traversal
	// Depth-first, post-order
	*postOrderTraversal(node?: TreeNode<T> | null) {
		node ??= this._root;
		if (node?.children.length) {
			for (let child of node.children) {
				yield* this.postOrderTraversal(child);
			}
		}
		yield node;
	}

	find(key: string) {
		for (let node of this.preOrderTraversal()) {
			if (node.key === key) return node;
		}
		return null;
	}

	findBy(valueOrPropValue: any, propName: string | null = null) {
		for (let node of this.preOrderTraversal()) {
			// search by prop + value
			if (propName && node.value[propName] && node.value[propName] === valueOrPropValue) {
				return node;
			}
			// search by value only
			else if (!propName && node.value === valueOrPropValue) {
				return node;
			}
		}
		return null;
	}

	// lowest common ancestor
	findLCA(node1Key: string, node2Key: string) {
		const _findLCA = (
			root: TreeNode<T> | null,
			node1: TreeNode<T>,
			node2: TreeNode<T>
		) => {
			if (!root || !node1 || !node2) return null;

			if (root === node1 || root === node2) {
				return root;
			}

			let foundNodes = 0;
			let foundNode: TreeNode<T> | null = null;

			for (const child of root.children) {
				const foundInSubtree = _findLCA(child, node1, node2);
				if (foundInSubtree) {
					foundNodes++;
					foundNode = foundInSubtree;
				}
				if (foundNodes === 2) {
					return root;
				}
			}

			return foundNode;
		};

		return _findLCA(this._root, this.find(node1Key), this.find(node2Key));
	}

	// sugar
	insert(parentNodeKey: string, value: T) {
		const node = this.find(parentNodeKey);
		if (node) {
			node.appendChild(value);
			return this;
		}
		return false;
	}

	remove(key: string) {
		if (!key) return false;

		if (this._root?.key === key) {
			this._root = null;
			return this;
		}

		for (let node of this.preOrderTraversal()) {
			if (node.removeChild(key)) {
				return true;
			}
		}

		return false;
	}

	protected _moveOrCopy(srcNodeKey: string, targetNodeKey: string, isMove: boolean) {
		const src = this.find(srcNodeKey);
		if (!src) return false;

		// cyclic reference is not allowed
		if (src.contains(targetNodeKey)) {
			throw new Error(`Cyclic reference detected.`);
		}

		const target = this.find(targetNodeKey);
		if (!target) return false;
		if (target.contains(src.key)) return false; // already there

		//
		if (isMove) {
			target.appendChild(src);
			this.remove(src.key);
		} else {
			target.appendChild(src.deepClone());
		}

		return this;
	}

	move(srcNodeKey: string, targetNodeKey: string) {
		return this._moveOrCopy(srcNodeKey, targetNodeKey, true);
	}

	copy(srcNodeKey: string, targetNodeKey: string) {
		return this._moveOrCopy(srcNodeKey, targetNodeKey, false);
	}

	toJSON() {
		return this._root?.toJSON();
	}

	dump() {
		return JSON.stringify(this);
	}

	restore(dump: string | TreeNodeDTO<T>) {
		let parsed: TreeNodeDTO<T> = dump as any;
		if (typeof dump === 'string') parsed = JSON.parse(dump);

		const _walk = (children: TreeNodeDTO<T>['children'], parent: TreeNode<T>) => {
			for (let child of children) {
				const node = parent.appendChild(child.value, false).__setKey(child.key);
				_walk(child.children, node);
			}
		};

		const root = new TreeNode(parsed.value).__setKey(parsed.key);
		_walk(parsed.children, root);

		this._root = root;
		return this;
	}

	contains(key: string) {
		return !!this._root?.contains(key);
	}

	toString() {
		return [...this.preOrderTraversal()].map((n) => n?.toString()).join('\n');
	}
}
