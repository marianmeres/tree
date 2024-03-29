import { Tree } from './tree.js';
export interface TreeNodeDTO<T> {
    key: string;
    value: T;
    children: TreeNodeDTO<T>[];
}
export declare class TreeNode<T> {
    value: T;
    protected _parent: TreeNode<T> | null;
    tree: Tree<T> | null;
    protected _key: string;
    protected _children: TreeNode<T>[];
    protected _readonly: boolean;
    static createKey: () => string;
    constructor(value: T, _parent?: TreeNode<T> | null, tree?: Tree<T> | null);
    __setKey(key: string): this;
    __setParent(parent: TreeNode<T> | null): this;
    __setTree(tree: Tree<T> | null): this;
    __setReadonly(flag?: boolean): this;
    __syncChildren(): void;
    get depth(): number;
    get readonly(): boolean;
    get root(): TreeNode<T> | null;
    get path(): TreeNode<T>[];
    get key(): string;
    get parent(): TreeNode<T> | null;
    get children(): TreeNode<T>[];
    get isLeaf(): boolean;
    get isRoot(): boolean;
    get siblings(): TreeNode<T>[];
    get siblingIndex(): number;
    protected _assertNotReadonly(): void;
    protected _assertSameTopRootNode(node: TreeNode<T>): void;
    protected _assertNotContains(node: TreeNode<T>): void;
    protected _assertIsNotSiblingOf(node: TreeNode<T>): void;
    toJSON(): TreeNodeDTO<T>;
    deepClone(): TreeNode<T>;
    appendChild(valueOrNode: T | TreeNode<T>, _sync?: boolean): TreeNode<T>;
    removeChild(key: string): this;
    replaceChild(key: string, valueOrNode: T | TreeNode<T>): TreeNode<T> | false;
    resetChildren(valuesOrNodes?: (T | TreeNode<T>)[]): this;
    previousSibling(): TreeNode<T> | null;
    nextSibling(): TreeNode<T> | null;
    moveSiblingIndex(toIndex: number): this;
    contains(key: string): boolean;
    toString(): string;
}
