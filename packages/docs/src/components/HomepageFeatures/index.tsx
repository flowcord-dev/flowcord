import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Declarative Builder API',
    description: (
      <>
        Define menus with a fluent, type-safe builder. Declare your embeds,
        buttons, modals, and lifecycle hooks — FlowCord handles the Discord
        interaction loop automatically.
      </>
    ),
  },
  {
    title: 'Full Lifecycle Control',
    description: (
      <>
        Hook into <code>onEnter</code>, <code>beforeRender</code>,{' '}
        <code>onAction</code>, <code>onLeave</code>, and more. Every stage of
        a menu session is observable and extensible.
      </>
    ),
  },
  {
    title: 'Composable Navigation',
    description: (
      <>
        Build multi-step flows with a first-class navigation stack. Navigate
        forward, go back, open sub-menus with typed results, and guard actions
        with composable middleware.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--lg">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
