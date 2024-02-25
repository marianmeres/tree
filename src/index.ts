export { TreeNode } from './tree/tree-node.js';
export { Tree } from './tree/tree.js';

// class Node {
// 	public children;
// 	public data;
// 	constructor(data) {
// 		this.data = data;
// 		this.children = [];
// 	}

// 	addChild(data) {
// 		const child = new Node(data);
// 		this.children.push(child);
// 	}
// }

// class Tree {
// 	public root;
// 	constructor() {
// 		this.root = null;
// 	}

// 	addRoot(data) {
// 		if (!this.root) {
// 			this.root = new Node(data);
// 		} else {
// 			console.log('Root already exists.');
// 		}
// 	}

// 	traverse(node, level = 0) {
// 		console.log(' '.repeat(level * 4) + node.data);
// 		node.children.forEach((child) => {
// 			this.traverse(child, level + 1);
// 		});
// 	}

// 	search(node, searchData) {
// 		if (node.data === searchData) {
// 			return node;
// 		} else {
// 			let result = null;
// 			node.children.some((child) => {
// 				result = this.search(child, searchData);
// 				return result !== null;
// 			});
// 			return result;
// 		}
// 	}

// 	findParent(root, node) {
// 		if (root === node) {
// 			return null; // Root nemá rodiča
// 		}

// 		function searchParent(currentNode, parentNode) {
// 			if (currentNode === node) {
// 				return parentNode;
// 			} else {
// 				for (const childNode of currentNode.children) {
// 					const found = searchParent(childNode, currentNode);
// 					if (found) {
// 						return found;
// 					}
// 				}
// 				return null;
// 			}
// 		}

// 		return searchParent(root, null);
// 	}

// 	moveNode(sourceData, targetData) {
// 		const sourceNode = this.search(this.root, sourceData);
// 		if (!sourceNode) {
// 			console.log(`Uzol s datami "${sourceData}" nebol najdeny.`);
// 			return;
// 		}

// 		const targetNode = this.search(this.root, targetData);
// 		if (!targetNode) {
// 			console.log(`Cielovy uzol s datami "${targetData}" nebol najdeny.`);
// 			return;
// 		}

// 		const parentNode = this.findParent(this.root, sourceNode);
// 		if (!parentNode) {
// 			console.log('Nemozno presunut korenovy uzol.');
// 			return;
// 		}

// 		// Odstranime uzol zo zoznamu potomkov jeho rodica
// 		const index = parentNode.children.indexOf(sourceNode);
// 		parentNode.children.splice(index, 1);

// 		// Presunieme uzol pod cielovy uzol
// 		targetNode.addChild(sourceNode.data);
// 	}
// }

// // Príklad   použitia:
// const htmlTree = new Tree();
// htmlTree.addRoot('html');
// htmlTree.root.addChild('head');
// htmlTree.root.addChild('body');
// const bodyNode = htmlTree.root.children[1];
// bodyNode.addChild('div');
// bodyNode.addChild('p');
// const divNode = bodyNode.children[0];
// divNode.addChild('h1');

// // Prechádzanie stromom a výpis štruktúry
// console.log('Štruktúra HTML stromu:');
// htmlTree.traverse(htmlTree.root);

// // Presun uzlu
// console.log('\nPresun uzlu:');
// htmlTree.moveNode('div', 'head');
// console.log('Štruktúra HTML stromu po presune:');
// htmlTree.traverse(htmlTree.root);
