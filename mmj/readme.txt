mmj 0_94 readMe
This is a multi-architecture, 32 / 64bit compatible, CC licensed version.
After "Java for Mac OS X 10.6 Update 1" has brought OS X java en par with Sun's implementations for Windows, Linux & Solaris and also added the missing support for accessing Midi hardware through javax.sound.midi there is basically no need for a 3rd party Midi service providerlike mmj anymore. However, some Mac users have brought to our attention that Apple's implementation seems to have some weak points (like ignoring timestamps on Midi messages), so this mmj release is an attempt to make mmj peacefully coexist with the OS's SPI implementation. It will likely remain to be the last and final build.

Please note that this version was built on Snow Leopard with XCode 3.2 and may have backward compatibility issues on older OS versions, due to new load commands that XCode seems to use regardless of which target OS version is set. If you run into such problems (normally showing up as "unsatisfied link error") try using the older builds in the 0_90 (64/32bit) or 0_88 (32bit only) folders. 

To make mmj available to all Java applications simply drop both mmj.jar and libmmj.jnilib into /Library/Java/Extensions.

To use the library exclusively copy mmj.jar & libmmj.jnilib to your application's contents/resources/java directory.

See "miditest.java" for example usage of mmj, both as a javax.sound.midi SPI as well as through its proprietary pa.

Use terms:
mmj is released under a Creative Commons Attribution-Non-Commercial-No Derivative Works 3.0 Germany License. You may 
freely use it in non commercial applications under the terms layed out there. To view the license, point your 
browser to: 
http://creativecommons.org/licenses/by-nc-nd/3.0/de/deed.en_GB

Selling, leasing, renting and other use of the library for commercial purposes is prohibited unless you enter a commercial license agreement with us.

copyright 2007-9
N.Peters
humatic GmbH
Leuschnerdamm 19
10999 Berlin, Germany

