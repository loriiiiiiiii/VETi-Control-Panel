"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

import { useMasonry } from "@/hooks/useMasonry";
import { cn } from "@/lib/utils";

export interface ImageGalleryProps {
    /** @public (required) - Array of images to display in the gallery */
    images: ImageItem[];
    /** @public (optional) - Space between images in pixels (default: 16) */
    gap?: number;
    /** @public (optional) - Columns to display in each screen size */
    columns?: {
        desktop?: number;
        tablet?: number;
        mobile?: number;
    };
    /** @public (optional) - Enable laxy loading of images (default: true) */
    lazyLoading?: boolean;
    /** @public (optional) - class name for the container */
    className?: string;
    /** @public (optional) - Callback when an image is clicked */
    onImageClick?: (image: ImageItem, index: number) => void;
    /** @public (optional) - Callback to filter images before rendering */
    filterImages?: (images: ImageItem, index: number) => boolean;
    /** @public (optional) - Callback sort images */
    sortImages?: (a: ImageItem, b: ImageItem) => number;
}

export interface ImageItem {
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

const observerOptions = {
    root: null,
    rootMargin: "500px",
    threshold: 0.01,
};

const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    gap = 16,
    columns = {
        desktop: 3,
        tablet: 2,
        mobile: 1,
    },
    lazyLoading = true,
    className,
    onImageClick,
    filterImages,
    sortImages,
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Set initial width - use a small delay to ensure layout is complete
        const timer = setTimeout(() => {
            setContainerWidth(container.clientWidth);
        }, 100);

        // Create ResizeObserver to track container size changes
        const resizeObserver = new ResizeObserver(() => {
            setContainerWidth(container.clientWidth);
        });

        resizeObserver.observe(container);

        return () => {
            clearTimeout(timer);
            resizeObserver.disconnect();
        };
    }, []);

    // Breakpoints are container-relative: the ResizeObserver above keeps
    // containerWidth accurate on rotation, unlike window.innerWidth which
    // can be stale when orientation events fire in Android WebViews.
    // Thresholds are lower than the usual viewport breakpoints because the
    // app's <main> caps content at max-w-4xl minus padding (~816px max).
    const noOfColumns = useMemo(() => {
        if (containerWidth < 600) return columns.mobile || 1;
        if (containerWidth < 800) return columns.tablet || 2;
        return columns.desktop as number;
    }, [containerWidth, columns.mobile, columns.tablet, columns.desktop]);

    const processedImages = useMemo(() => {
        let result = [...images];

        if (filterImages) {
            result = result.filter((image, index) =>
                filterImages(image, index),
            );
        }

        if (sortImages) {
            result = result.sort((a, b) => sortImages(a, b));
        }

        return result;
    }, [images, filterImages, sortImages]);

    const { layout, totalHeight } = useMasonry(
        processedImages,
        containerWidth,
        {
            gap,
            columns: noOfColumns as number,
        },
    );

    // Load initially visible images + those within buffer to prevent blinking
    useEffect(() => {
        if (layout.length === 0) return;

        let observer: IntersectionObserver | null = null;

        // Use requestAnimationFrame to ensure DOM is rendered before observing
        const rafId = requestAnimationFrame(() => {
            const imageElements =
                containerRef.current?.querySelectorAll("[data-src]");

            // Preload initially visible images + buffer area
            const imagesToLoad = new Set<string>();
            imageElements?.forEach((el) => {
                const src = (el as HTMLElement).dataset.src;
                if (src) {
                    const rect = el.getBoundingClientRect();
                    // Preload images within large buffer to prevent blinking
                    if (
                        rect.top < window.innerHeight + 500 &&
                        rect.bottom > -500
                    ) {
                        imagesToLoad.add(src);
                    }
                }
            });

            if (imagesToLoad.size > 0) {
                setLoadedImages((prev) => {
                    const newSet = new Set(prev);
                    imagesToLoad.forEach((src) => {
                        newSet.add(src);
                    });
                    return newSet;
                });
            }

            // Setup observer for lazy loading remaining images
            observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const src = (entry.target as HTMLElement).dataset.src;

                        if (src) {
                            // Mark image as loaded when entering viewport
                            setLoadedImages((prev) => {
                                const newSet = new Set(prev);
                                newSet.add(src);
                                return newSet;
                            });
                            if (observer) {
                                observer.unobserve(entry.target);
                            }
                        }
                    }
                });
            }, observerOptions);

            imageElements?.forEach((el) => {
                if (observer) {
                    observer.observe(el);
                }
            });
        });

        return () => {
            cancelAnimationFrame(rafId);
            if (observer) {
                observer.disconnect();
            }
        };
    }, [layout.length]);

    const handleImageClick = useCallback(
        (image: ImageItem, index: number) => {
            onImageClick?.(image, index);
        },
        [onImageClick],
    );

    return (
        <div
            ref={containerRef}
            className={cn("w-full relative", className)}
            style={{
                height: `${totalHeight}px`,
            }}
        >
            {layout.map((item, index) => {
                const shouldLoadImage =
                    !lazyLoading || loadedImages.has(item.src);

                return (
                    <div
                        key={`${item.src}-${index}`}
                        data-src={item.src}
                        className={cn(
                            "rounded-lg",
                            lazyLoading &&
                                !shouldLoadImage &&
                                "bg-muted-foreground/10 animate-pulse",
                        )}
                        style={{
                            position: "absolute",
                            left: `${item.x}px`,
                            top: `${item.y}px`,
                            width: `${item.displayWidth}px`,
                            height: `${item.displayHeight}px`,
                            overflow: "hidden",
                        }}
                    >
                        {shouldLoadImage ? (
                            <img
                                src={item.src}
                                alt={item.alt}
                                className="w-full h-full cursor-pointer"
                                onClick={() => handleImageClick(item, index)}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
};

export { ImageGallery };
