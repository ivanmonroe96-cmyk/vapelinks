#!/usr/bin/env python3
"""
Replaces Shopify CDN image URLs in data files with local paths.
Downloads missing images first, then updates all JSON references.
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent
PRODUCTS_DIR = ROOT / "public" / "images" / "products"
COLLECTIONS_DIR = ROOT / "public" / "images" / "collections"

def get_local_files(directory):
    """Get set of files in directory."""
    if not directory.exists():
        return set()
    return set(os.listdir(directory))

def find_local_image(handle, index, local_files, is_collection=False):
    """Find local image file matching handle_index.ext pattern."""
    for ext in ['jpg', 'png', 'webp', 'jpeg', 'gif', 'svg']:
        if is_collection:
            name = f"{handle}.{ext}"
        else:
            name = f"{handle}_{index}.{ext}"
        if name in local_files:
            return name
    return None

def get_extension_from_url(url):
    """Extract file extension from Shopify CDN URL."""
    # Remove query params
    clean = url.split('?')[0]
    ext = clean.rsplit('.', 1)[-1].lower() if '.' in clean else 'jpg'
    if ext not in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'):
        ext = 'jpg'
    return ext

def download_image(url, dest_path, retries=3):
    """Download image from URL to dest_path with retries."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            })
            with urllib.request.urlopen(req, timeout=30) as response:
                with open(dest_path, 'wb') as f:
                    f.write(response.read())
            return True
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
            else:
                print(f"  FAILED: {e} -> {url[:80]}")
                return False
    return False

def process_products(json_path, local_files, download=True):
    """Process products JSON file - download missing and update URLs."""
    with open(json_path, 'r') as f:
        products = json.load(f)

    updated = 0
    downloaded = 0
    failed = 0

    for product in products:
        handle = product.get('handle', '')
        if not handle:
            continue

        for i, img in enumerate(product.get('images', [])):
            src = img.get('src', '')
            if 'cdn.shopify.com' not in src:
                continue

            # Check if local file exists
            local_name = find_local_image(handle, i, local_files)

            if not local_name and download:
                # Download it
                ext = get_extension_from_url(src)
                local_name = f"{handle}_{i}.{ext}"
                dest = PRODUCTS_DIR / local_name
                print(f"  Downloading: {local_name}")
                if download_image(src, dest):
                    local_files.add(local_name)
                    downloaded += 1
                else:
                    failed += 1
                    continue

            if local_name:
                img['src'] = f"/images/products/{local_name}"
                updated += 1

    with open(json_path, 'w') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    return updated, downloaded, failed

def process_collections(json_path, local_files):
    """Process collections JSON file - update image URLs."""
    with open(json_path, 'r') as f:
        collections = json.load(f)

    updated = 0

    for collection in collections:
        handle = collection.get('handle', '')
        img = collection.get('image', {})
        if not img or not handle:
            continue

        src = img.get('src', '')
        if 'cdn.shopify.com' not in src:
            continue

        local_name = find_local_image(handle, 0, local_files, is_collection=True)
        if local_name:
            img['src'] = f"/images/collections/{local_name}"
            updated += 1

    with open(json_path, 'w') as f:
        json.dump(collections, f, indent=2, ensure_ascii=False)

    return updated

def main():
    print("=" * 60)
    print("Shopify CDN URL Migration Script")
    print("=" * 60)

    product_files = get_local_files(PRODUCTS_DIR)
    collection_files = get_local_files(COLLECTIONS_DIR)

    # Process products.json
    print("\n--- products.json ---")
    products_path = ROOT / "src" / "data" / "products.json"
    updated, downloaded, failed = process_products(products_path, product_files, download=True)
    print(f"  Updated: {updated} image URLs")
    print(f"  Downloaded: {downloaded} missing images")
    print(f"  Failed: {failed} downloads")

    # Process disposable-vapes.json
    print("\n--- disposable-vapes.json ---")
    dv_path = ROOT / "src" / "data" / "disposable-vapes.json"
    updated, downloaded, failed = process_products(dv_path, product_files, download=True)
    print(f"  Updated: {updated} image URLs")
    print(f"  Downloaded: {downloaded} missing images")
    print(f"  Failed: {failed} downloads")

    # Process collections.json
    print("\n--- collections.json ---")
    collections_path = ROOT / "src" / "data" / "collections.json"
    updated = process_collections(collections_path, collection_files)
    print(f"  Updated: {updated} image URLs")

    # Verify no more CDN URLs in image src fields
    print("\n--- Verification ---")
    for name, path in [("products.json", products_path), ("disposable-vapes.json", dv_path), ("collections.json", collections_path)]:
        with open(path) as f:
            data = json.load(f)
        remaining = 0
        if name == "collections.json":
            for item in data:
                img = item.get('image', {})
                if img and 'cdn.shopify.com' in img.get('src', ''):
                    remaining += 1
        else:
            for item in data:
                for img in item.get('images', []):
                    if 'cdn.shopify.com' in img.get('src', ''):
                        remaining += 1
        print(f"  {name}: {remaining} Shopify CDN URLs remaining in image src fields")

    print("\nDone!")

if __name__ == "__main__":
    main()
