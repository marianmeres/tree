class t{value;_parent;tree;_key;_children=[];static createKey=()=>"n-"+Math.random().toString(36).slice(2,10);constructor(e,r=null,i=null){this.value=e,this._parent=r,this.tree=i,this._key=t.createKey()}__setKey(t){return this._key=t,this}__setParent(t){return this._parent=t,this}__setTree(t){return this.tree=t,this}__syncChildren(){const t=(e,r)=>{for(let i of e)i.__setParent(r).__setTree(r?.tree||null),t(i.children,i)};return t(this._children,this)}get depth(){return this.path.length}get root(){let t=this._parent,e=t;for(;t;)t=t.parent,t&&(e=t);return e}get path(){let t=this._parent,e=[];for(t&&e.push(t);t;)t=t.parent,t&&e.unshift(t);return e}get key(){return this._key}get parent(){return this._parent}get children(){return this._children}get isLeaf(){return 0===this._children.length}get isRoot(){return null===this._parent}get siblings(){return this._parent?.children||[]}get siblingIndex(){return this.siblings.length?this.siblings.findIndex((t=>t.key===this._key)):-1}_assertSameTopRootNode(e){if(e instanceof t&&e.root!==this.root)throw new Error("Cannot proceed with a node from a different tree. (Use node's value instead.)")}_assertNotContains(e){if(e instanceof t&&this.contains(e.key))throw new Error("Cannot proceed, already contains. (Use node's value instead.)")}toJSON(){return{key:this._key,value:this.value,children:this._children}}deepClone(){const e=JSON.parse(JSON.stringify(this.toJSON(),((e,r)=>"key"===e?t.createKey():r))),r=new t(e.value,this._parent);r.__setKey(e.key);const i=(t,e)=>{for(let r of t){const t=e.appendChild(r.value).__setKey(r.key);i(r.children,t)}};return i(e.children,r),r}appendChild(e,r=!0){this._assertSameTopRootNode(e),this._assertNotContains(e);const i=e instanceof t?e:new t(e,this);return i.__setParent(this),this._children.push(i),r&&this.__syncChildren(),i}removeChild(t){const e=this._children.findIndex((e=>e.key===t));return!(e<0)&&(this._children.splice(e,1),this)}replaceChild(e,r){this._assertSameTopRootNode(r);const i=this._children.findIndex((t=>t.key===e));if(i<0)return!1;this._assertNotContains(r);const n=r instanceof t?r:new t(r,this);return n.__setParent(this),this._children[i]=n,this.__syncChildren(),this._children[i]}resetChildren(t=[]){return this._children=[],(t||[]).forEach((t=>this.appendChild(t,!1))),this.__syncChildren(),this}previousSibling(){if(this.siblings.length){const t=this.siblings.findIndex((t=>t.key===this._key));return this.siblings[t-1]||null}return null}nextSibling(){if(this.siblings.length){const t=this.siblings.findIndex((t=>t.key===this._key));return this.siblings[t+1]||null}return null}moveSiblingIndex(t){const e=this.siblingIndex;return this.siblings.length<2||((t=Math.min(t,this.siblings.length-1))<0&&(t=Math.max(0,this.siblings.length-1+t)),this.siblings.splice(t,0,this.siblings.splice(e,1)[0])),this}contains(t){if(!t)return!1;const e=r=>{for(let i of r){if(i.key===t)return!0;if(e(i.children))return!0}return!1};return e(this._children)}toString(){return"    ".repeat(this.depth)+this.value?.toString()}}class e{_root;constructor(t=null){this._root=t,this._root&&this._root.__setTree(this)}static factory(t){return(new e).restore(t)}appendChild(e){return this._root?this._root.appendChild(e):(this._root=e instanceof t?e:new t(e),this._root.__setTree(this),this._root.__syncChildren(),this._root)}get root(){return this._root}*preOrderTraversal(t){if(t??=this._root,yield t,t?.children.length)for(let e of t.children)yield*this.preOrderTraversal(e)}*postOrderTraversal(t){if(t??=this._root,t?.children.length)for(let e of t.children)yield*this.postOrderTraversal(e);yield t}find(t){for(let e of this.preOrderTraversal())if(e.key===t)return e;return null}findBy(t,e=null){for(let r of this.preOrderTraversal()){if(e&&void 0!==r.value[e]&&r.value[e]===t)return r;if(!e&&r.value===t)return r}return null}findLCA(t,e){if(!t||!t)return null;const r=this.find(t),i=this.find(e);if(!r||!i)return null;if(r===i)return r;const n=r.path.reduce(((t,e)=>({...t,[e.key]:e})),{});let s=this._root;for(let t of i.path){if(!n[t.key])return s;s=n[t.key]}return s}insert(t,e){const r=this.find(t);return!!r&&r.appendChild(e)}remove(t){if(!t)return!1;if(this._root?.key===t)return this._root=null,this;for(let e of this.preOrderTraversal())if(e.removeChild(t))return this;return!1}_moveOrCopy(t,e,r){const i=this.find(t);if(!i)return!1;if(i.contains(e))throw new Error("Cyclic reference detected.");const n=this.find(e);return!!n&&(!n.contains(i.key)&&(r?(n.appendChild(i),this.remove(i.key)):n.appendChild(i.deepClone()),this))}move(t,e){return this._moveOrCopy(t,e,!0)}copy(t,e){return this._moveOrCopy(t,e,!1)}toJSON(){return this._root?.toJSON()}dump(){return JSON.stringify(this)}restore(e){let r=e;"string"==typeof e&&(r=JSON.parse(e));const i=(t,e)=>{for(let r of t){const t=e.appendChild(r.value,!1).__setKey(r.key);i(r.children,t)}},n=new t(r.value).__setKey(r.key);return i(r.children,n),this._root=n,this}size(t){return t??=this._root,t&&(t===this._root||this.contains(t?.key))?[...this.preOrderTraversal(t)].length:0}contains(t){return!!this._root?.contains(t)}toString(){return[...this.preOrderTraversal()].map((t=>t?.toString())).join("\n")}}export{e as Tree,t as TreeNode};
