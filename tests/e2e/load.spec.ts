import { expect, test } from '@playwright/test'

test.describe('load smoke workflow automation', () => {
  test('LOAD001 public launch surfaces handle 100 concurrent smoke requests', async ({ request }) => {
    const paths = ['/', '/invitation', '/landing-page']
    const responses = await Promise.all(
      Array.from({ length: 100 }, (_, index) => request.get(paths[index % paths.length])),
    )

    const failed = responses.filter((response) => response.status() >= 500)
    expect(failed).toHaveLength(0)
  })
})
