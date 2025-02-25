const baseLoggerStyle = {
    position: 'fixed',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '10px',
    fontFamily: 'monospace',
    zIndex: '100'
};

export const loggers = {
    navigation: {
        ...baseLoggerStyle,
        top: '50%',
        right: '10px',
        color: 'white'
    },

    portal: {
        ...baseLoggerStyle,
        top: '50%',
        left: '10px',
        color: 'yellow'
    },

    camera: {
        ...baseLoggerStyle,
        bottom: '10px',
        left: '10px',
        color: 'white'
    },

    scale: {
        ...baseLoggerStyle,
        top: '10px',
        left: '10px',
        color: 'white'
    }
};

export function createLogger(type) {
    const div = document.createElement('div');
    const styles = loggers[type];

    Object.keys(styles).forEach(style => {
        div.style[style] = styles[style];
    });

    document.body.appendChild(div);
    return div;
}

export function removeAllLoggers() {
    document.querySelectorAll('[data-logger]').forEach(logger => {
        logger.remove();
    });
}
