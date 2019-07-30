module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2018,
    },
    plugins: [
        'import',
        'unicorn',
        'promise',
        'security',
        'prettier',
    ],
    extends: [
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:unicorn/recommended',
        'plugin:promise/recommended',
        // 'plugin:security/recommended',
        'prettier',
        'problems',
    ],
    settings: {},
    globals: {},
    rules: {
        'unicorn/filename-case': 'off',
        'prefer-template': 'off',
        'prefer-arrow-callback': 'off',
        'object-shorthand': 'off'
    },
};
