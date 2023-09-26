# Configuration

Runtime configuration can be performed via environment variables.

- You can configure the environment variables at the container for production
- You can configure an [`.env` file](https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env) for local development.

## Environment Variables

```sh
# Configures the base URL of Element, used to register the Jitsi Widget.
# Setting the variable is not important, as an Element intance chooses to use a
# local version of the Jitsi Widget anyway. Defaults to `https://app.element.io`.
REACT_APP_ELEMENT_BASE_URL=https://app.element.io

# The hostname of the Jitsi Instance where video conferences should be hosted.
# Defaults to `jitsi.riot.im`
REACT_APP_JITSI_HOST_NAME=jitsi.riot.im

# Additional widgets that should be added to the session rooms.
# Example: `[{"id":"widget","name":"Widget","type":"net.nordeck.widget-2:pad","url":"http://2.widget.example"}]`
# Important: The id and type fields must be unique.
REACT_APP_EXTRA_WIDGETS=[]
```
