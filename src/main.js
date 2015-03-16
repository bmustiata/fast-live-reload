var application = new Application();
var watcher = new Watcher(".");


watcher.addListener( application.filesChanged.bind(application) );
application.run();
watcher.monitor();
