import { mount } from '@vue/test-utils';
import { test, expect } from 'vitest';
import HelloWorld from '../src/components/HelloWorld.vue';

test('mount component', async () => {
  expect(HelloWorld).toBeTruthy();

  const wrapper = mount(HelloWorld, {
    props: {
      msg: 'Hello World!',
    },
  });

  expect(wrapper.text()).toContain('Hello World!');
  expect(wrapper.html()).toMatchSnapshot();
});
