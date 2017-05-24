# express-dump

Like a regular dump, only quicker.

```JS
const app = require('express')();
const dump = require('express-dump');

const { middleware, dump: flush } = dump();

app.use(middleware);
app.listen(5000);

process.on('SIGINT', function() {
    flush()
        .then(() => process.exit());
        // Profit
});
```

# install
with [npm](https://npmjs.org) do:

```
npm install express-dump
```

# license

MIT
