import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

let ReuiInstance;

async function getReui() {
  if (!ReuiInstance) {
    const reactModule = await import('react');
    const React = reactModule.default ?? reactModule;

    if (!React.PropTypes) {
      Object.defineProperty(React, 'PropTypes', {
        value: PropTypes,
        configurable: true,
      });
    }

    const mod = await import('reui/lib/Reui.js');
    ReuiInstance = mod.default ?? mod;

    ReuiInstance.setGlobalTheme({
      Panel: {
        panel: 'reui-panel',
        panelHeading: 'reui-panel__heading',
        panelBody: 'reui-panel__body',
      },
      Button: {
        button: 'reui-button',
        buttonXs: 'reui-button--xs',
        buttonSm: 'reui-button--sm',
        buttonMd: 'reui-button--md',
        buttonLg: 'reui-button--lg',
        buttonDisabled: 'reui-button--disabled',
        buttonActive: 'reui-button--active',
        buttonDefault: 'reui-button--default',
        buttonPrimary: 'reui-button--primary',
        buttonSuccess: 'reui-button--success',
        buttonWarning: 'reui-button--warning',
        buttonDanger: 'reui-button--danger',
      },
    });
  }

  return ReuiInstance;
}

export default function ReuiDemo() {
  const [Reui, setReui] = useState(null);

  useEffect(() => {
    let active = true;

    getReui().then((loadedReui) => {
      if (active) {
        setReui(loadedReui);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!Reui) {
    return <div className="reui-loading">Loading panel…</div>;
  }

  return (
    <Reui.Panel title="Preparedness map">
      <p className="panel-copy">Use the map to check conditions near your current location.</p>
      <Reui.Button title="Center on me" color="primary" size="md" className="reui-demo-button" />
    </Reui.Panel>
  );
}
