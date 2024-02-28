import { TreeNode, TreeNodeDTO } from './tree-node.js';
export declare class Tree<T> {
    protected _root: TreeNode<T> | null;
    protected _readonly: boolean;
    constructor(_root?: TreeNode<T> | null, _readonly?: boolean);
    get readonly(): boolean;
    __setReadonly(flag?: boolean): this;
    static factory<T>(dump: string | TreeNodeDTO<T>, _readonly?: boolean): Tree<T>;
    appendChild(valueOrNode: T | TreeNode<T>): TreeNode<T>;
    get root(): TreeNode<T> | null;
    preOrderTraversal(node?: TreeNode<T> | null): any;
    postOrderTraversal(node?: TreeNode<T> | null): any;
    find(key: string): TreeNode<T> | null;
    findBy(valueOrPropValue: any, propName?: string | null): any;
    findLCA(node1Key: string, node2Key: string): TreeNode<T> | null;
    insert(parentNodeKey: string, value: T): false | TreeNode<T>;
    remove(key: string): false | this;
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
