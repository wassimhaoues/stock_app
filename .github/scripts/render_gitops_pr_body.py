#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Render the GitOps PR body")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--tag", required=True, help="Published image tag")
    parser.add_argument("--app-commit-sha", required=True, help="Application commit SHA")
    parser.add_argument("--app-commit-short", required=True, help="Short application commit SHA")
    parser.add_argument("--updated-images-file", required=True, help="Text file containing updated image lines")
    args = parser.parse_args()

    updated_images = Path(args.updated_images_file).read_text(encoding="utf-8").splitlines()

    body_lines = [
        "## GitOps image bump",
        "",
        "Images mises a jour :",
    ]

    body_lines.extend(updated_images)
    body_lines.extend(
        [
            "Tags publies :",
            f"- {args.tag}",
            "",
            "Commit applicatif declencheur :",
            f"- {args.app_commit_sha}",
            f"- commit court : {args.app_commit_short}",
            "",
        ]
    )

    Path(args.output).write_text("\n".join(body_lines), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
