run:
  vite --open

build:
  # Strip types
  npx sucrase ./src --out-dir ./out --transforms typescript 

  # Remove import
  sd 'import "p5";' '' ./out/**/*.js
  sd 'import p5 from "p5";' '' ./out/**/*.js

  # Prettier
  npx prettier --write ./out