class e{value;_parent;tree;_key;_children=[];_readonly=!1;static createKey=()=>"n-"+Math.random().toString(36).slice(2,10);constructor(t,r=null,n=null){this.value=t,this._parent=r,this.tree=n,this._key=e.createKey()}__setKey(e){return this._key=e,this}__setParent(e){return this._parent=e,this}__setTree(e){return this.tree=e,this}__setReadonly(e=!0){return this._readonly=e,this}__syncChildren(){const e=(t,r)=>{for(let n of t)n.__setParent(r).__setTree(r?.tree||null).__setReadonly(r?.readonly),e(n.children,n)};return e(this._children,this)}get depth(){return this.path.length}get readonly(){return this._readonly}get root(){let e=this._parent,t=e;for(;e;)e=e.parent,e&&(t=e);return t}get path(){let e=this._parent,t=[];for(e&&t.push(e);e;)e=e.parent,e&&t.unshift(e);return t}get key(){return this._key}get parent(){return this._parent}get children(){return this._children}get isLeaf(){return 0===this._children.length}get isRoot(){return null===this._parent}get siblings(){return this._parent?.children||[]}get siblingIndex(){return this.siblings.length?this.siblings.findIndex((e=>e.key===this._key)):-1}_assertNotReadonly(){if(this._readonly)throw new Error("Cannot proceed because the node is marked as readonly")}_assertSameTopRootNode(t){if(!this.isRoot&&t instanceof e&&t.root!==this.root)throw new Error("Cannot proceed with a node from a different tree. (Use node's value instead.)")}_assertNotContains(t){if(t instanceof e&&this.contains(t.key))throw new Error("Cannot proceed, already contains.")}_assertIsNotSiblingOf(t){if(t instanceof e&&this.siblings.some((e=>e.key===t.key)))throw new Error("Cannot proceed (is sibling of).")}toJSON(){return{key:this._key,value:this.value,children:this._children}}deepClone(){const t=JSON.parse(JSON.stringify(this.toJSON(),((t,r)=>"key"===t?e.createKey():r))),r=new e(t.value,this._parent);r.__setKey(t.key);const n=(e,t)=>{for(let r of e){const e=t.appendChild(r.value).__setKey(r.key);n(r.children,e)}};return n(t.children,r),r}appendChild(t,r=!0){this._assertNotReadonly(),this._assertSameTopRootNode(t),this._assertIsNotSiblingOf(t);const n=t instanceof e?t:new e(t,this);return n.__setParent(this),this._children.push(n),r&&this.__syncChildren(),n}removeChild(e){this._assertNotReadonly();const t=this._children.findIndex((t=>t.key===e));if(t<0)throw new Error(`Node "${e}" not found.`);return this._children.splice(t,1),this}replaceChild(t,r){this._assertNotReadonly(),this._assertSameTopRootNode(r);const n=this._children.findIndex((e=>e.key===t));if(n<0)throw new Error(`Node "${t}" not found.`);this._assertNotContains(r);const i=r instanceof e?r:new e(r,this);return i.__setParent(this),this._children[n]=i,this.__syncChildren(),this._children[n]}resetChildren(e=[]){return this._assertNotReadonly(),this._children=[],(e||[]).forEach((e=>this.appendChild(e,!1))),this.__syncChildren(),this}previousSibling(){if(this.siblings.length){const e=this.siblings.findIndex((e=>e.key===this._key));return this.siblings[e-1]||null}return null}nextSibling(){if(this.siblings.length){const e=this.siblings.findIndex((e=>e.key===this._key));return this.siblings[e+1]||null}return null}moveSiblingIndex(e){this._assertNotReadonly();const t=this.siblingIndex;return this.siblings.length<2||((e=Math.min(e,this.siblings.length-1))<0&&(e=Math.max(0,this.siblings.length-1+e)),this.siblings.splice(e,0,this.siblings.splice(t,1)[0])),this}contains(e){if(!e)throw new Error("Missing key");const t=r=>{for(let n of r){if(n.key===e)return!0;if(t(n.children))return!0}return!1};return t(this._children)}toString(){let e=this.value?.toString();return"[object Object]"===e&&(e=this.key),"    ".repeat(this.depth)+e}}class t{_root;_readonly;constructor(e=null,t=!1){this._root=e,this._readonly=t,this._root&&this._root.__setTree(this).__setReadonly(this._readonly).__syncChildren()}get readonly(){return this._readonly}__setReadonly(e=!0){return this._readonly=!!e,this._root&&this._root.__setReadonly(this._readonly).__syncChildren(),this}static factory(e,r=!1){return new t(null,r).restore(e)}appendChild(t){return this._root?this._root.appendChild(t).__setReadonly(this._readonly):(this._root=t instanceof e?t:new e(t),this._root.__setTree(this).__syncChildren(),this._root)}get root(){return this._root}*preOrderTraversal(e){if(e??=this._root,yield e,e?.children.length)for(let t of e.children)yield*this.preOrderTraversal(t)}*postOrderTraversal(e){if(e??=this._root,e?.children.length)for(let t of e.children)yield*this.postOrderTraversal(t);yield e}find(e){for(let t of this.preOrderTraversal())if(t.key===e)return t;return null}findBy(e,t=null){for(let r of this.preOrderTraversal()){if(t&&void 0!==r.value[t]&&r.value[t]===e)return r;if(!t&&r.value===e)return r}return null}findLCA(e,t){const r=this.find(e),n=this.find(t);if(!r||!n)throw new Error(`Node "${e}" and/or "${t}" not found.`);if(r===n)return r;const i=r.path.reduce(((e,t)=>({...e,[t.key]:t})),{});let s=this._root;for(let e of n.path){if(!i[e.key])return s;s=i[e.key]}return s}insert(e,t){const r=this.find(e);if(r)return r.appendChild(t).__setReadonly(this._readonly);throw new Error(`Node "${e}" not found.`)}remove(e){if(this._root?.key===e)return this._root=null,this;for(let t of this.preOrderTraversal())if(t.key===e&&t.parent.removeChild(e))return this;throw new Error(`Node "${e}" not found.`)}_moveOrCopy(e,t,r){const n=this.find(e);if(!n)throw new Error(`Source node "${e}" not found.`);if(r&&n.contains(t))throw new Error("Cyclic reference detected.");const i=this.find(t);if(!i)throw new Error(`Target node "${t}" not found.`);if(r&&i===n)throw new Error("Cannot move to self.");return r&&i===n.parent?n:r?(this.remove(n.key),i.appendChild(n).__setReadonly(this._readonly)):i.appendChild(n.deepClone()).__setReadonly(this._readonly)}move(e,t){return this._moveOrCopy(e,t,!0)}copy(e,t){return this._moveOrCopy(e,t,!1)}toJSON(){return this._root?.toJSON()}dump(){return JSON.stringify(this)}restore(t){let r=t;"string"==typeof t&&(r=JSON.parse(t));const n=(e,t)=>{for(let r of e){const e=t.appendChild(r.value,!1).__setTree(this).__setKey(r.key);n(r.children,e)}},i=new e(r.value).__setTree(this).__setKey(r.key);return n(r.children,i),this._readonly&&[...this.postOrderTraversal()].map((e=>e?.__setReadonly(this._readonly))),this._root=i,this}size(e){if(e??=this._root,!e)return 0;const t=[...this.preOrderTraversal(e)].length;return e===this._root||1!==t||this.contains(e?.key)?t:0}contains(e){return!!this._root?.contains(e)}toString(){return[...this.preOrderTraversal()].map((e=>e?.toString())).join("\n")}}export{t as Tree,e as TreeNode};
