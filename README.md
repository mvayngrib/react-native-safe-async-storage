
# react-native-safe-async-storage

Wrapper around AsyncStorage that writes large values to the filesystem using [react-native-fs](https://github.com/johanneslumpe/react-native-fs). This is to avoid the dread "android java.lang.IllegalStateException: Couldn't read row 0, col 0 from CursorWindow" when large values are stored using AsyncStorage.

# Usage

```bash
npm install --save react-native-fs # peer dep
npm install --save react-native-safe-async-storage
rnpm link
```

```js
import AsyncStorage from 'react-native-safe-async-storage'
// use as you would AsyncStorage
// large values are stored to fs.DocumentDirectoryPath + '/fsas'
```
