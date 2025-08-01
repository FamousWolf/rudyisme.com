import { DateTime } from 'luxon'

export default function(config) {
    config.setInputDirectory('src');
    config.setIncludesDirectory('_includes');
    config.setLayoutsDirectory('_layouts');
    config.setOutputDirectory('public');

    config.addPassthroughCopy('./src/assets');

    config.addFilter('postDate', (dateObj) => {
        return DateTime.fromJSDate(dateObj).toFormat('EEEE d LLLL yyyy');
    });
    config.addFilter('rawPostDate', (dateObj) => {
        return DateTime.fromJSDate(dateObj).toFormat('yyyy-LL-dd');
    });

    config.addCollection('post', function (collection) {
        return collection.getAllSorted().reverse();
    });
};
