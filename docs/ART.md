# Орбитальный непревзойдённый объект

Файл игры: `public/orbital.png`.

Референс предоставлен пользователем: `images.jpeg`, Орбитальный объект из Зазеркалья. Обработан встроенным imagegen; исходная иллюстрация не изменена. В генерации оставлены узнаваемые лицо, улыбка и лучи; удалены небо, замок и надпись. Финальная версия на белом фоне компонуется в игре через CSS `mix-blend-mode: multiply`. Это не PNG с прозрачностью. В исходном пустынном фоне круг солнца удалён.

## Промпт выделения

Use case: background-extraction. Asset type: transparent PNG sprite for the background of a desert puzzle game. Input image is the edit target: extract ONLY the grinning golden sun-like Orbital object in the top half. Preserve the exact distinctive face identity, broad toothy grin, wide eyes, angle, golden yellow coloration and irregular sharp triangular rays from this reference. Do not redesign the face or invent a different face. Remove all blue sky, clouds, castle, landscape and all typography. Isolate the entire face and rays on a genuinely transparent alpha background, not a checkerboard or a solid background. Center the complete object, all rays visible with a small transparent margin; restore the tiny clipped top tip to make complete silhouette. The result should read as the same surreal retro game character, clean edges, no blue halo. Square PNG, only one object, no words.

## Финальный промпт корректировки

Precise background replacement only. Preserve this exact golden grinning Orbital character and all rays, expression, colors, placement and face details unchanged. Replace ALL of the gray-white checkerboard background with perfectly flat pure white #FFFFFF, including all gaps between rays. White must be uniform, not off-white, no texture, no shadow, no halo, no checkerboard, no grid. This asset will be composited over a background using multiply blend. Keep complete ray tips inside canvas with 3 percent pure white padding. One object, square image, no added words or elements.

# Логотип Зазеркалья

Файл игры: `public/zazerkalye-logo.png` (1143×826, PNG с прозрачностью). Оригинал без изменений взят с сайта Зазеркалья 16 сентября 2026 года: https://zazer-kalye.com/game/logo_lowres.png. В игре уменьшен средствами CSS и ведёт на https://zazer-kalye.com; локальная копия включается в офлайн-кэш PWA.
