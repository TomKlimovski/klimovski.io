// localStorage, guarded for private browsing and sandboxed contexts.
export const storage = {
    get(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private browsing */ }
    },
};
