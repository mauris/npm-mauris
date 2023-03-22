# whatsnew

`whatsnew` is a dependency version checking tool that takes semantic versioning into consideration when constructing upgrade paths which provides developers opportunities to apply code migrations and remove deprecations.

To use `whatsnew`, you can install it as a CLI tool by running:

```shell
npm install --global @mauris/whatsnew
# command available as `whatsnew`
```

or install it in your repository as part of `devDependencies`:

```shell
npm install --dev @mauris/whatsnew
# command available as `npx whatsnew`
```

Run the CLI tool at the root of your code repository where `package.json` resides.

```
whatsnew <dependencyName> [options]
```

For example, to check for new versions and upgrade path for `typescript`, you can run:

```
whatsnew typescript
```

If you wish to apply the next step of the upgrade plan, add the `--apply` option:

```
whatsnew typescript --apply
```

## License

MIT License, Copyright (c) 2023 Sam Yong
