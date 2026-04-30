import os
import json
from . import WEB_DIRECTORY

class AnimaGalleryNode:
    STYLES = []

    @classmethod
    def INPUT_TYPES(cls):
        if not cls.STYLES:
            cls.load_styles()
        return {
            "required": {
                "artist": (cls.STYLES, {
                    "default": cls.STYLES[0] if cls.STYLES else "",
                    "label": "Artist's style"
                })
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "process"
    CATEGORY = "XAV/anima"

    @classmethod
    def load_styles(cls):
        node_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(node_dir, "js", "data.json")
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            cls._raw_data = data
            cls.STYLES = [f"{item['name']} ({item['p']}/{item['id']})" for item in data]
        except Exception as e:
            print(f"[AnimaGalleryNode] Loading error data.json: {e}")
            cls.STYLES = ["none"]
            cls._raw_data = []

    def process(self, artist):
        name = artist.split(" (")[0] if " (" in artist else artist
        prompt = f"@{name}"
        return (prompt,)

NODE_CLASS_MAPPINGS = {
    "AnimaGalleryNode": AnimaGalleryNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AnimaGalleryNode": "Anima Style Gallery",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]