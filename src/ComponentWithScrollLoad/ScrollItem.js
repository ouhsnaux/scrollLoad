import React from 'react';
import './style.css';

// import ComponentWithScrollLoad from './ComponentWithScrollLoad';
// const Component = ({ text }) => <div className="scrollitem">{text}</div>
// export default ComponentWithScrollLoad(Component);


// import ScrollLoad from './ScrollLoad';
// const Component = ({ text }) => (
//   <ScrollLoad>
//     <div className="scrollitem">{text}</div>
//   </ScrollLoad>
// );
// export default Component;
import useLoading from './useLoading';

const Component = ({ text }) => {
  const ref = React.useRef(null);
  const loading = useLoading(ref);
  return (
    <div className="scrollitem" ref={ref}>{loading ? 'loading' : text}</div>
  )
}

export default Component;
