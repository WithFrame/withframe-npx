<p align="center">
  <a href="https://withfra.me">
    <img src="https://raw.githubusercontent.com/WithFrame/withframe-npx/main/assets/logo.full.png" alt="WithFrame" width="420" />
  </a>
</p>

<h1 align="center">Withframe</h1>

<p align="center">
  CLI for adding and uploading WithFrame components in React Native / Expo projects.
</p>

## Features

- Add components from WithFrame registry to your project
- Upload component drafts to the registry
- Upload screenshots and attach them to collections
- Device login flow for CLI auth
- Local project config via `withframe.config.json`

## Installation

Use directly with `npx`:

```bash
npx withframe@latest --help
```

Or install globally:

```bash
npm i -g withframe
withframe --help
```

## Quick Start

1. Initialize config (optional but recommended):

```bash
npx withframe init
```

2. Login:

```bash
npx withframe login
```

3. Set token in one of two ways:

Option A: export in shell

```bash
export WITHFRAME_TOKEN="wf_..."
```

Option B: save in project `.env` or `.env.local`

```bash
WITHFRAME_TOKEN="wf_..."
```

4. Add a component:

```bash
npx withframe add button
```

## Commands

- `withframe init` - create/update `withframe.config.json`
- `withframe login` - start device auth flow
- `withframe logout` - clear local auth token file
- `withframe add <component>` - add component files to project
- `withframe upload` - upload component draft to registry
- `withframe shot --file <path>` - upload screenshot

Run `withframe <command> --help` for command options.

## Configuration

`withframe.config.json`:

```json
{
  "outputDir": "src/components",
  "target": "react_native"
}
```

- `outputDir` - where generated files are written
- `target` - `react_native` or `expo`
