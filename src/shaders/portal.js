const portalVertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const portalFragmentShader = `
    uniform float time;
    uniform vec3 portalColor1;
    uniform vec3 portalColor2;
    uniform float hoverState;
    varying vec2 vUv;

    void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 pos = vUv - center;
        float angle = atan(pos.y, pos.x);
        float dist = length(pos);
        
        // Swirling effect
        float swirl = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;
        
        // Magic ripple effect
        float magicRipple = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
        
        // Rune pattern
        float runePattern = step(0.7, sin(angle * 8.0 + time) * 0.5 + 0.5);
        
        // Combine colors with effects
        vec3 color = mix(portalColor1, portalColor2, swirl * 0.5 + 0.5);
        color += vec3(magicRipple * 0.2);
        
        // Add glow on hover
        float glowStrength = hoverState * 0.3;
        color += vec3(glowStrength);

        gl_FragColor = vec4(color, 0.8);
    }
`;

export { portalVertexShader, portalFragmentShader };
