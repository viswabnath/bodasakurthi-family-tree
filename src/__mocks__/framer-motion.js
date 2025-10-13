// Mock framer-motion for testing
import React from 'react';

const createMotionComponent = (Component) => {
  return React.forwardRef((props, ref) => {
    const { 
      animate, 
      initial, 
      exit, 
      transition, 
      variants, 
      whileHover, 
      whileTap, 
      whileInView,
      onAnimationComplete,
      layout,
      layoutId,
      drag,
      dragConstraints,
      ...restProps 
    } = props;
    
    return React.createElement(Component, { ref, ...restProps });
  });
};

const motion = {
  div: createMotionComponent('div'),
  button: createMotionComponent('button'),
  form: createMotionComponent('form'),
  span: createMotionComponent('span'),
  img: createMotionComponent('img'),
  section: createMotionComponent('section'),
  article: createMotionComponent('article'),
  header: createMotionComponent('header'),
  footer: createMotionComponent('footer'),
  nav: createMotionComponent('nav'),
  main: createMotionComponent('main'),
  aside: createMotionComponent('aside'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  h4: createMotionComponent('h4'),
  h5: createMotionComponent('h5'),
  h6: createMotionComponent('h6'),
  p: createMotionComponent('p'),
  ul: createMotionComponent('ul'),
  ol: createMotionComponent('ol'),
  li: createMotionComponent('li'),
};

export { motion };
export const AnimatePresence = ({ children }) => children;