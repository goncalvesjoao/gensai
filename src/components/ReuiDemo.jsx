import React from 'react';
import Reui from 'reui/lib/Reui.js';

const reuiTheme = {
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
};

Reui.setGlobalTheme(reuiTheme);

export default function ReuiDemo() {
  return (
    <Reui.Panel title="Preparedness map">
      <p className="panel-copy">Use the map to check conditions near your current location.</p>
      <Reui.Button title="Center on me" color="primary" size="md" className="reui-demo-button" />
    </Reui.Panel>
  );
}
