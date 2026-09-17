import { it,expect } from 'vitest';
import { render,screen } from '@testing-library/react';
import { ChatMarkdown } from './TutorPanel';
it('does not execute HTML or load remote/asset images',()=>{
 const {container}=render(<ChatMarkdown content={'<script>alert(1)</script>\n\n![image](https://evil.test/track.png)\n\n![private](asset://123)\n\n[bad](javascript:alert(1))\n\n**safe** $E=mc^2$'}/>);
 expect(container.querySelector('script')).toBeNull();expect(container.querySelector('img')).toBeNull();
 expect(container.innerHTML).not.toContain('href="javascript:');expect(screen.getByText('safe')).toBeVisible();expect(container.querySelector('.katex')).not.toBeNull();
});
