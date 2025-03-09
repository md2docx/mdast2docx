# MDAST (Markdown Abstract Syntax Tree) to DOCX <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/>

[![test](https://github.com/tiny-md/mdast2docx/actions/workflows/test.yml/badge.svg)](https://github.com/tiny-md/mdast2docx/actions/workflows/test.yml) [![Maintainability](https://api.codeclimate.com/v1/badges/aa896ec14c570f3bb274/maintainability)](https://codeclimate.com/github/tiny-md/mdast2docx/maintainability) [![codecov](https://codecov.io/gh/tiny-md/mdast2docx/graph/badge.svg)](https://codecov.io/gh/tiny-md/mdast2docx) [![Version](https://img.shields.io/npm/v/mdast2docx.svg?colorB=green)](https://www.npmjs.com/package/mdast2docx) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/d18m/mdast2docx.svg)](https://www.npmjs.com/package/mdast2docx) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/mdast2docx) [![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/from-referrer/)

MDAST (Markdown Abstract Syntax Tree) to DOCX is a comprehensive library designed to unlock the full potential of React 18 server components. It provides customizable loading animation components and a fullscreen loader container, seamlessly integrating with React and Next.js.

✅ Fully Treeshakable (import from `mdast2docx/client/loader-container`)

✅ Fully TypeScript Supported

✅ Leverages the power of React 18 Server components

✅ Compatible with all React 18 build systems/tools/frameworks

✅ Documented with [Typedoc](https://tiny-md.github.io/mdast2docx) ([Docs](https://tiny-md.github.io/mdast2docx))

✅ Examples for Next.js, and Vite

> <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 20px"/> Star [this repository](https://github.com/tiny-md/mdast2docx) and share it with your friends.

## Getting Started

### Installation

```bash
pnpm add mdast2docx
```

**_or_**

```bash
npm install mdast2docx
```

**_or_**

```bash
yarn add mdast2docx
```

## Want Lite Version? [![npm bundle size](https://img.shields.io/bundlephobia/minzip/mdast2docx-lite)](https://www.npmjs.com/package/mdast2docx-lite) [![Version](https://img.shields.io/npm/v/mdast2docx-lite.svg?colorB=green)](https://www.npmjs.com/package/mdast2docx-lite) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/d18m/mdast2docx-lite.svg)](https://www.npmjs.com/package/mdast2docx-lite)

```bash
pnpm add mdast2docx-lite
```

**or**

```bash
npm install mdast2docx-lite
```

**or**

```bash
yarn add mdast2docx-lite
```

> You need `r18gs` as a peer-dependency

### Import Styles

You can import styles globally or within specific components.

```css
/* globals.css */
@import "mdast2docx/dist";
```

```tsx
// layout.tsx
import "mdast2docx/dist/index.css";
```

For selective imports:

```css
/* globals.css */
@import "mdast2docx/dist/client"; /** required if you are using LoaderContainer */
@import "mdast2docx/dist/server/bars/bars1";
```

### Usage

Using loaders is straightforward.

```tsx
import { Bars1 } from "mdast2docx/dist/server/bars/bars1";

export default function MyComponent() {
  return someCondition ? <Bars1 /> : <>Something else...</>;
}
```

For detailed API and options, refer to [the API documentation](https://tiny-md.github.io/mdast2docx).

**Using LoaderContainer**

`LoaderContainer` is a fullscreen component. You can add this component directly in your layout and then use `useLoader` hook to toggle its visibility.

```tsx
// layout.tsx
<LoaderContainer />
	 ...
```

```tsx
// some other page or component
import { useLoader } from "mdast2docx/dist/hooks";

export default MyComponent() {
	const { setLoading } = useLoader();
	useCallback(()=>{
		setLoading(true);
		...do some work
		setLoading(false);
	}, [])
	...
}
```

## License

This library is licensed under the MPL-2.0 open-source license.



> <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 20px"/> Please enroll in [our courses](https://mayank-chaudhari.vercel.app/courses) or [sponsor](https://github.com/sponsors/mayank1513) our work.

<hr />

<p align="center" style="text-align:center">with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
