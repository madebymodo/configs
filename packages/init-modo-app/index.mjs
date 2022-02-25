import chalk from "chalk";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import os from "os";
import spawn from "cross-spawn";

const dependencies = ["gitlab:cescoc/eslint-config-modo-base"];

const create = async () => {
  console.log(`Installing ${chalk.cyan("MODO")} tools...`);

  const hasPackageJson = readFileSync(path.join(process.cwd(), "package.json"));

  if (hasPackageJson) {
    console.log(`Detected existing package.json...`);
  } else {
    console.log(`Initializing new project...`);
  }

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

  const command = "npm";
  const args = [
    "install",
    "--no-audit", // https://github.com/facebook/create-react-app/issues/11174
    "--save",
    "--save-exact",
    "--loglevel",
    "error",
  ].concat(dependencies);

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

  const eslintConfig = {
    extends: ["modo-base"],
  };
  writeFileSync(
    path.join(process.cwd(), ".eslintrc.json"),
    JSON.stringify(eslintConfig, null, 2) + os.EOL
  );
};

await create();
