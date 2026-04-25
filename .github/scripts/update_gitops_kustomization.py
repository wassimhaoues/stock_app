#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path


def update_image_block(lines: list[str], image_name: str, new_name: str, new_tag: str) -> bool:
    marker = f"  - name: {image_name}"
    for index, line in enumerate(lines):
        if line == marker:
            if index + 2 >= len(lines):
                raise ValueError(f"Incomplete image block for {image_name}")
            if not lines[index + 1].startswith("    newName: "):
                raise ValueError(f"Unexpected newName line for {image_name}: {lines[index + 1]!r}")
            if not lines[index + 2].startswith("    newTag: "):
                raise ValueError(f"Unexpected newTag line for {image_name}: {lines[index + 2]!r}")
            lines[index + 1] = f"    newName: {new_name}"
            lines[index + 2] = f"    newTag: {new_tag}"
            return True
    raise ValueError(f"Image block not found for {image_name}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Update GitOps image tags in kustomization.yaml")
    parser.add_argument("--file", required=True, help="Path to kustomization.yaml")
    parser.add_argument("--backend-tag", help="New backend image tag")
    parser.add_argument("--frontend-tag", help="New frontend image tag")
    parser.add_argument("--backend-name", required=True, help="Backend image repository")
    parser.add_argument("--frontend-name", required=True, help="Frontend image repository")
    args = parser.parse_args()

    if not args.backend_tag and not args.frontend_tag:
        raise SystemExit("At least one of --backend-tag or --frontend-tag must be provided")

    file_path = Path(args.file)
    original_text = file_path.read_text(encoding="utf-8")
    lines = original_text.splitlines()

    if args.backend_tag:
        update_image_block(lines, "stockpro-backend", args.backend_name, args.backend_tag)
    if args.frontend_tag:
        update_image_block(lines, "stockpro-frontend", args.frontend_name, args.frontend_tag)

    updated_text = "\n".join(lines) + "\n"
    if updated_text != original_text:
        file_path.write_text(updated_text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
