{ pkgs, ... }: {
  channel = "stable-24.11";
  packages = [ pkgs.nodejs_22 pkgs.firebase-tools ];
  idx.extensions = [ "dbaeumer.vscode-eslint" ];
  idx.previews = { enable = true; previews.web = { command = [ "npm" "run" "dev" "--" "--port" "$PORT" ]; manager = "web"; }; };
  idx.workspace.onCreate.install = "npm install";
}
