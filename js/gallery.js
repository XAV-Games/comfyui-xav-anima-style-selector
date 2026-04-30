import { app } from "/scripts/app.js";

const BASE_URL = "https://raw.githubusercontent.com/ThetaCursed/Anima-Style-Explorer/main/images";


const createIframeModal = (onSelect) => {
    const modal = document.createElement("div");
    modal.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: garkgray; z-index: 10000; display: flex; flex-direction: column;";
    
    const iframe = document.createElement("iframe");
    iframe.src = "/extensions/comfyui-xav-anima-style-selector/gallery.html?15";
    iframe.style = "flex-grow: 1; width: 100%; height: 100%; border: none;";
    
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&#10005;";
	closeBtn.style = `
		position: fixed;
		top: 14px;
		right: 14px;
		width: 42px;
		height: 41px;
		z-index: 10001;
		font-size: 1.4em;
		line-height: 1.3em;
		font-weight: bolder;
		background-color: #f43f5e9c;
		border-radius: 100%;
		border: solid 1px #fff;
		box-shadow: 0px 2px 7px 1px #7c5cfca1;
		cursor: pointer;
	`;
    
    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    document.body.appendChild(modal);
	
	const handle = (event) => {
        if (event.data.type === "iframeSelection") {
            onSelect(event.data.value);
            document.body.removeChild(modal);
			window.removeEventListener("message", handle);
        }
    }
	
    closeBtn.onclick = () => {
		document.body.removeChild(modal);
		window.removeEventListener("message", handle);
	}

    window.addEventListener("message", handle);
};


// 2. Основное расширение для ноды AnimaGalleryNode
app.registerExtension({
    name: "Anima.Gallery",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "AnimaGalleryNode") return;

        // Оборачиваем onNodeCreated
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (onNodeCreated) onNodeCreated.apply(this, arguments);

            this.artistWidget = this.widgets.find(w => w.name === "artist");
			
			const selectByIndex = (index) => {
				this.artistWidget.value = this.artistWidget.options.values[index];
				this.artistWidget.callback(this.artistWidget.value);
			};
			
			const selectById = (id) => {
				let item;
				const find = "/" + id + ")";
				for (let i = 0; i < this.artistWidget.options.values.length; i ++) {
					item = this.artistWidget.options.values[i];
					if (item.indexOf(find) < 0) continue;
					this.artistWidget.value = item;
					break;
				}
				this.artistWidget.callback(this.artistWidget.value);
			};
			
			const selectFromGallery = () => {
				createIframeModal((id) => {
					selectById(id);
				});
			};
			
			const selectRandom = () => {
				let index = this.artistWidget.options.values.length;
				index = Math.floor(Math.random() * (index));
				selectByIndex(index);
			};
			
			this.imageElement = new Image();
            this.imageElement.crossOrigin = "anonymous";
			this.imageElement.onload = () => { app.graph.setDirtyCanvas(true, true); };
			
			this.addWidget("button", "Gallery", null, selectFromGallery);
			this.addWidget("button", "Random", null, selectRandom);
			
			const margin = 10;
			let ww = this.width - margin * 2;
			
			const previewWidget = this.addCustomWidget({
				name: "image_preview",
				type: "custom_canvas",
				draw(ctx, node, widget_width, y, widget_height) {
					if (node.imageElement && node.imageElement.src) {
						ww = widget_width - margin * 2;
						ctx.drawImage(node.imageElement, margin, y, ww, ww * 1.5);
					}
				},
				computeSize() {
					return [ww, ww * 1.5];
				}
			});

            const updatePreview = (artistValue) => {
                if (!artistValue) return;
                const match = artistValue.match(/\(([^)]+)\)$/);
                if (!match) return;
                const id = match[1];
                const url = `${BASE_URL}/${id}.webp`;
                this.imageElement.src = url;
            };

            if (this.artistWidget) {
                const origCallback = this.artistWidget.callback;
                this.artistWidget.callback = (value) => {
                    if (origCallback) origCallback(value);
                    updatePreview(value);
                };
				setTimeout(() => {
					updatePreview(this.artistWidget.value);
				}, 100);
            }
        };
    }
});