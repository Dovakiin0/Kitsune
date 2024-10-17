import { useState, useEffect } from 'react';

type ScrollPosition = {
    x: number;
    y: number;
};

const useScrollPosition = (): ScrollPosition => {
    const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
        x: 0,
        y: 0,
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition({
                x: window?.scrollX,
                y: window?.scrollY,
            });
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return scrollPosition;
};

export default useScrollPosition;
