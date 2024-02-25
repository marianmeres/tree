export const createIdGenerator = (prefix: string = 'key', scopeLength = 4) => {
	let _counter = 0;
	scopeLength = Math.abs(scopeLength);

	// prettier-ignore
	const scope = scopeLength ? Math.random().toString(36).slice(2, 2 + scopeLength) : null;

	//
	return () => [prefix, scope, ++_counter].filter(Boolean).join('-');
};
