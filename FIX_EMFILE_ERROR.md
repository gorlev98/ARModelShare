# Fix EMFILE Error - Too Many Open Files

## What I Fixed

### ✅ 1. Updated Vite Config
Added watch exclusions to `vite.config.ts` to prevent watching unnecessary directories:
- `node_modules/` - npm packages (thousands of files)
- `.git/` - git history
- `dist/` - build output
- `coverage/` - test coverage
- `.cache/` - cache directories

This should fix the issue in most cases.

## If Error Persists - Increase System Limit

Your current limit: **65536** watches

If you still get the error, increase the system limit:

### Temporary Fix (until reboot)

```bash
sudo sysctl fs.inotify.max_user_watches=524288
sudo sysctl -p
```

### Permanent Fix (survives reboot)

1. Edit the sysctl config:
```bash
sudo nano /etc/sysctl.conf
```

2. Add this line at the end:
```
fs.inotify.max_user_watches=524288
```

3. Save and exit (Ctrl+X, Y, Enter)

4. Apply the changes:
```bash
sudo sysctl -p
```

5. Verify the new limit:
```bash
cat /proc/sys/fs/inotify/max_user_watches
```
Should show: `524288`

## Try Running Dev Server Again

```bash
npm run dev
```

The server should start without the EMFILE error!

## Why This Happens

- **Linux** uses `inotify` to watch files for changes
- Each watched file/directory consumes one "watch"
- `node_modules` contains thousands of files
- Default limit (65536) can be exceeded in large projects
- Vite needs to watch for hot module replacement (HMR)

## What We Did

1. **Excluded unnecessary directories** from Vite's file watcher
2. **Instructions to increase system limit** if needed

## Alternative: Use Polling (Not Recommended)

If you can't increase the system limit, you can use polling instead:

Edit `vite.config.ts`:
```typescript
server: {
  watch: {
    usePolling: true,
  },
}
```

⚠️ Polling is slower and uses more CPU, so only use as last resort.
