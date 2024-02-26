import { TreeNode, TreeNodeDTO } from './tree-node.js';
export declare class Tree<T> {
    protected _root: TreeNode<T> | null;
    constructor(_root?: TreeNode<T> | null);
    appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T>;
    get root(): TreeNode<T> | null;
    preOrderTraversal(node?: TreeNode<T> | null): any;
    postOrderTraversal(node?: TreeNode<T> | null): any;
    find(key: string): TreeNode<T> | null;
    findBy(valueOrPropValue: any, propName?: string | null): any;
    findLCA(node1Key: string, node2Key: string): any;
    insert(parentNodeKey: string, value: T): false | TreeNode<T>;
    remove(key: string): boolean | this;
    protected _moveOrCopy(srcNodeKey: string, targetNodeKey: string, isMove: boolean): false | this;
    move(srcNodeKey: string, targetNodeKey: string): false | this;
    copy(srcNodeKey: string, targetNodeKey: string): false | this;
    toJSON(): TreeNodeDTO<T> | undefined;
    dump(): string;
    restore(dump: string | TreeNodeDTO<T>): this;
    size(from?: TreeNode<T> | null): number;
    contains(key: string): boolean;
    toString(): string;
}
