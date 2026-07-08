import { useEffect, useState } from "react";

import type { ImageItem } from "@/components/shadix-ui/components/image-gallery";

export interface MasonryItem extends ImageItem {
    x: number;
    y: number;
    displayHeight: number;
    displayWidth: number;
}

export interface MasonryConfig {
    gap: number;
    columns: number;
}

const useMasonry = (
    images: ImageItem[],
    containerWidth: number,
    config: MasonryConfig,
) => {
    const [layout, setLayout] = useState<MasonryItem[]>([]);
    const [totalHeight, setTotalHeight] = useState(0);

    useEffect(() => {
        if (!containerWidth || images.length === 0 || config.columns < 1)
            return;

        // Column-based masonry: images keep their native aspect ratio, so
        // column bottoms may be ragged (no scale-to-fill).
        const totalGapWidth = config.gap * (config.columns - 1);
        const availableWidth = containerWidth - totalGapWidth;
        const columnWidth = availableWidth / config.columns;

        const columnHeights: number[] = Array(config.columns).fill(0);
        const newLayout: MasonryItem[] = [];

        // Place each image in the currently shortest column
        images.forEach((image) => {
            const columnIndex = columnHeights.indexOf(
                Math.min(...columnHeights),
            );

            // Use provided dimensions or default to square (1:1) aspect ratio
            const aspectRatio =
                image.width && image.height ? image.width / image.height : 1;

            const displayWidth = columnWidth;
            const displayHeight = displayWidth / aspectRatio;

            newLayout.push({
                ...image,
                x: columnIndex * (columnWidth + config.gap),
                y: columnHeights[columnIndex],
                displayWidth,
                displayHeight,
            });

            columnHeights[columnIndex] += displayHeight + config.gap;
        });

        setLayout(newLayout);
        setTotalHeight(Math.max(...columnHeights) - config.gap);
    }, [images, containerWidth, config.gap, config.columns]);

    return {
        layout,
        totalHeight,
    };
};

export { useMasonry };
