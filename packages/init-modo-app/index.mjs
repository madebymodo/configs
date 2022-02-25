#!/usr/bin/env node

import chalk from "chalk";
import { existsSync, writeFileSync } from "fs";
import path from "path";
import os from "os";
import spawn from "cross-spawn";

const dependencies = ["gitlab:cescoc/eslint-config-modo-base"];

const create = async () => {
  console.log(`Init ${chalk.cyan("MODO")} project`);

  const hasPackageJson = existsSync(path.join(process.cwd(), "package.json"));

  console.log(`Checking for existing package.json...`);

  if (hasPackageJson) {
    console.log(`Detected existing package.json...`);
  } else {
    console.log(`No package.json found.`);
    console.log(`Initializing new dummy project...`);
    const packageJson = {
      name: "app-name",
      version: "0.0.0",
      private: true,
    };
    writeFileSync(
      path.join(process.cwd(), "package.json"),
      JSON.stringify(packageJson, null, 2) + os.EOL
    );
  }

  const command = "npm";
  const args = [
    "install",
    "--no-audit", // https://github.com/facebook/create-react-app/issues/11174
    "--save",
    "--save-exact",
    "--loglevel",
    "error",
  ].concat(dependencies);

  console.log(`Installing dependencies...`);

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`,
        });
        return;
      }
      resolve();
    });
  });

  console.log(`Writing configs...`);

  const prettierConfig = {
    printWidth: 100,
    trailingComma: "es5",
    tabWidth: 2,
    semi: false,
    singleQuote: true,
  };
  writeFileSync(
    path.join(process.cwd(), ".prettierrc"),
    JSON.stringify(prettierConfig, null, 2) + os.EOL
  );

  const eslintConfig = {
    extends: ["modo-base"],
  };
  writeFileSync(
    path.join(process.cwd(), ".eslintrc.json"),
    JSON.stringify(eslintConfig, null, 2) + os.EOL
  );

  console.log(`${chalk.green("Done!")}`);
};

await create();
