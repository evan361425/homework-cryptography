# cryptography-homework
[Coursera](https://www.coursera.org/learn/crypto) 的密碼學課程功課。

僅供參考。

## 目錄

- [課程歷程](#課程歷程)
- [安裝](#安裝)
- [使用方法](#使用方法)
- [下載或建立測試檔案](#下載或建立測試檔案)
- [授權](#授權)
- [TODO](#TODO)

## 課程歷程

- Many Time Attack - 2020-10-22
- Hashing Videos - 2020-12-07
- Padding Oracle Attack - 2020-12-14
- Meet In Middle Attack in RSA - 2020-12-21
- Close Factor Attack in RSA - 2020-12-29

## 安裝

```shell
$ npm install
```

## 使用方法

先[下載](#下載或建立測試檔案)該有的檔案，然後執行下列程式碼。

```shell
# many time attack on one time padding
$ npm run many-time-attack
# hashing video
$ npm run hash-video
# padding oracle attack
$ npm run padding-oracle-attack
# meet in middle in RSA
$ npm run rsa-meet-in-middle-attack
# close factor in RSA
$ npm run rsa-close-factor-attack
# test all
$ npm run test
# test playground, do whatever you want!
$ npm run playground
```

## 下載或建立測試檔案

### Many Time Attack
- `data.json` : object with `train`, `test`

Example:
```json
{
  "train": ["123", "456"],
  "test": ["789"]
}
```

### Hashing Videos
- `data.json` : object with `test`, `check` (optional), represent filename of videos (in same folder).
- [Checking MAC video](https://crypto.stanford.edu/~dabo/onlineCrypto/6.1.intro.mp4_download)
- [Testing MAC video](https://crypto.stanford.edu/~dabo/onlineCrypto/6.2.birthday.mp4_download)

Example:
```json
{
  "test": {
    "video": "test.mp4"
  },
  "check": {
    "video": "check.mp4",
    "tag": "123"
  }
}
```

### Padding Oracle Attack
- `data.json` : object with `url`, `path`, `queryKey`, `cypher`, `decrypted` (optional)

Example:
```json
{
  "url": "http://crypto-class.appspot.com",
  "path": "/po",
  "queryKey": "er",
  "cypher": "f20bdba6ff29eed7b046d1df9fb7000058b1ffb4210a580f748b4ac714c001bd"
}
```

### Meet In Middle Attack in RSA
- `data.json` : object with `g`, `h`, `p`, `keySize`

Example:
```json
{
  "g": "2",
  "h": "7",
  "p": "13",
  "keySize": 4
}
```

### Close Factor in RSA
- `data.json` : array of object with `N`, `bound`

Example:
```json
[
  {
    "N": "323",
    "bound": 1
  },
  {
    "N": "232166152",
    "bound": [1, 100]
  },
  {
    "N": "622288097498926496141095869268883999563096063592498055290461",
    "3p+2q": true
  }
]
```

## 授權

請看 [LICENSE](./LICENSE)。

## TODO

- [ ] Multi threads: workerpool
- [ ] Python
