## Windows PATH Troubleshooting

If you experience issues with running the application on Windows, this section is dedicated to troubleshooting PATH-related problems after using the Quick Install method.

### Automatic PATH Handling

During the installation process, the application should automatically manage the Windows PATH variable. This ensures that the application can be run from any command prompt or terminal window.

### If Issues Persist

1. **Check Installation Directory**: Ensure that the application is installed in a directory that is included in your system's PATH environment variable.

2. **Manual PATH Update**: If the application is not recognized, you may need to manually add the installation directory to your PATH:
   - Right-click on 'This PC' or 'Computer' on your desktop or in File Explorer.
   - Select 'Properties'.
   - Click on 'Advanced system settings'.
   - Click on the 'Environment Variables' button.
   - In the 'System Variables' section, find the 'PATH' variable and click 'Edit'.
   - Add your application's installation directory to the list. Be sure to separate it from other entries with a semicolon.

3. **Restart Command Prompt**: After making changes to the PATH, close and reopen any command prompt windows for the changes to take effect.

4. **Reboot Your PC**: In some cases, a system reboot may be required to ensure changes are applied correctly.

If you continue to encounter issues, refer to the documentation or support forums for further assistance.